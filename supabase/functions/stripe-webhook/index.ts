import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription, event.type);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(supabaseClient, stripe, invoice);
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSubscriptionChange(
  supabaseClient: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventType: string
) {
  logStep("Handling subscription change", { 
    subscriptionId: subscription.id, 
    eventType,
    status: subscription.status 
  });

  // Get customer details
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    logStep("Customer not found or deleted");
    return;
  }

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) {
    logStep("Customer email not found");
    return;
  }

  // Get subscription tier based on price
  let subscriptionTier = "Free"; // Default to Free
  let revenue = 0;
  
  if (subscription.items.data.length > 0) {
    const price = subscription.items.data[0].price;
    const amount = price.unit_amount || 0;
    revenue = amount / 100; // Convert cents to euros
    
    logStep("Processing subscription price", { 
      amount, 
      priceId: price.id,
      currency: price.currency 
    });
    
    // Determine tier based on price amount (in cents)
    if (amount >= 2500) {
      subscriptionTier = "Pro";
    } else if (amount >= 1200) {
      subscriptionTier = "Starter";
    } else if (amount > 0) {
      // If there's a price but it doesn't match known tiers, log a warning
      logStep("WARNING: Unknown subscription price amount", { amount });
      subscriptionTier = "Free"; // Default to Free for unknown prices
    }
  }

  const isActive = subscription.status === "active";
  const subscriptionEnd = isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null;

  logStep("Subscription details before update", {
    email: customerEmail,
    isActive,
    tier: subscriptionTier,
    subscriptionEnd,
    stripeCustomerId: subscription.customer
  });

  // Only update if we have a valid tier determined
  if (!subscriptionTier || subscriptionTier === "Free") {
    logStep("WARNING: Attempting to set Free tier - verifying this is intended", {
      subscriptionStatus: subscription.status,
      itemsCount: subscription.items.data.length
    });
  }

  // Update subscribers table - the database trigger will automatically handle analytics
  const { error: updateError } = await supabaseClient
    .from("subscribers")
    .upsert({
      email: customerEmail,
      stripe_customer_id: subscription.customer,
      subscribed: isActive,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (updateError) {
    logStep("Error updating subscriber", { error: updateError.message });
  } else {
    logStep("Updated subscriber", { email: customerEmail, subscribed: isActive, tier: subscriptionTier });
    logStep("Analytics will be automatically updated by database trigger");
  }
}

async function handlePaymentSuccess(
  supabaseClient: any,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  logStep("Handling payment success", { 
    invoiceId: invoice.id, 
    amount: invoice.amount_paid 
  });

  // Update income analytics
  const revenue = (invoice.amount_paid || 0) / 100; // Convert cents to euros
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabaseClient
    .from("income_analytics")
    .upsert({
      date_recorded: today,
      total_revenue: revenue,
      subscription_revenue: revenue,
      net_revenue: revenue * 0.97, // Assuming 3% processing fee
      transaction_count: 1,
      monthly_recurring_revenue: revenue,
    }, { 
      onConflict: 'date_recorded',
      ignoreDuplicates: false 
    });

  if (error) {
    logStep("Error updating income analytics", { error: error.message });
  }

  // Send payment notification email to admin
  await sendPaymentNotification(invoice, stripe);
}

async function sendPaymentNotification(invoice: Stripe.Invoice, stripe: Stripe) {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not set, skipping payment notification");
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    const customerEmail = customer && !customer.deleted ? (customer as Stripe.Customer).email : 'Unknown';
    const customerName = customer && !customer.deleted ? (customer as Stripe.Customer).name || customerEmail : 'Unknown';
    
    const amount = ((invoice.amount_paid || 0) / 100).toFixed(2);
    const currency = (invoice.currency || 'eur').toUpperCase();
    const invoiceDate = new Date().toLocaleString('en-GB', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });

    // Determine subscription tier from line items
    let tier = 'Unknown';
    if (invoice.lines?.data?.length > 0) {
      const amount_cents = invoice.lines.data[0].amount || 0;
      if (amount_cents >= 2500) tier = 'Pro';
      else if (amount_cents >= 1200) tier = 'Starter';
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">💰 New Payment Received!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10B981; font-size: 1.2em; font-weight: bold;">€${amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Customer:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Plan:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <span style="background: ${tier === 'Pro' ? '#8B5CF6' : '#3B82F6'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9em;">${tier}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${invoiceDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>Invoice ID:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-size: 0.85em; color: #6b7280;">${invoice.id}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://dashboard.stripe.com/payments/${invoice.payment_intent}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              View in Stripe Dashboard
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 0.85em; margin-top: 20px;">
          This is an automated notification from RombiPost
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "RombiPost <noreply@rombipost.com>",
        to: ["admin@rombipost.com"], // Replace with actual admin email
        subject: `💰 New Payment: €${amount} from ${customerName}`,
        html: emailHtml,
      }),
    });

    if (res.ok) {
      logStep("Payment notification email sent successfully");
    } else {
      const errorText = await res.text();
      logStep("Failed to send payment notification", { error: errorText });
    }
  } catch (error) {
    logStep("Error sending payment notification", { error: error instanceof Error ? error.message : String(error) });
  }
}