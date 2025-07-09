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
  let subscriptionTier = null;
  let revenue = 0;
  
  if (subscription.items.data.length > 0) {
    const price = subscription.items.data[0].price;
    const amount = price.unit_amount || 0;
    revenue = amount / 100; // Convert cents to euros
    
    if (amount >= 2500) {
      subscriptionTier = "Pro";
    } else if (amount >= 1200) {
      subscriptionTier = "Starter";
    }
  }

  const isActive = subscription.status === "active";
  const subscriptionEnd = isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null;

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
}

// This function is no longer needed as the database trigger handles all analytics updates automatically