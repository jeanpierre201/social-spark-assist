
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Authentication failed", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Use native fetch to call Stripe API directly
    const customersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text();
      logStep("ERROR: Stripe customers API failed", { status: customersResponse.status, error: errorText });
      throw new Error(`Stripe API error: ${customersResponse.status} - ${errorText}`);
    }

    const customersData = await customersResponse.json();
    logStep("Stripe customers response", customersData);
    
    if (customersData.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customersData.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      logStep("ERROR: Stripe subscriptions API failed", { status: subscriptionsResponse.status, error: errorText });
      throw new Error(`Stripe API error: ${subscriptionsResponse.status} - ${errorText}`);
    }

    const subscriptionsData = await subscriptionsResponse.json();
    logStep("Stripe subscriptions response", subscriptionsData);
    
    const hasActiveSub = subscriptionsData.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptionsData.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (priceResponse.ok) {
        const price = await priceResponse.json();
        const amount = price.unit_amount || 0;
        
        // €12 = 1200 cents for Starter, €25 = 2500 cents for Pro
        if (amount >= 2500) {
          subscriptionTier = "Pro";
        } else if (amount >= 1200) {
          subscriptionTier = "Starter";
        } else {
          subscriptionTier = "Basic";
        }
        logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
      } else {
        logStep("Failed to fetch price details, defaulting to Basic tier");
        subscriptionTier = "Basic";
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, tier: subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    const upsertResult = await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (upsertResult.error) {
      logStep("ERROR: Failed to update subscribers table", upsertResult.error);
      throw new Error(`Database error: ${upsertResult.error.message}`);
    }

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
