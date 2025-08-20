
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        error: "No authorization header provided"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        error: "Authentication failed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // First check our local database for subscription info
    const { data: existingSubscriber, error: dbError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (dbError) {
      logStep("Database query error", { error: dbError.message });
    }

    // If we have a local record and it's recent (less than 1 hour old), return it
    if (existingSubscriber && existingSubscriber.updated_at) {
      const lastUpdate = new Date(existingSubscriber.updated_at);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 1) {
        logStep("Returning cached subscription data", { 
          subscribed: existingSubscriber.subscribed,
          tier: existingSubscriber.subscription_tier,
          lastUpdate: existingSubscriber.updated_at
        });
        
        return new Response(JSON.stringify({
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // If no cached data or data is stale, check Stripe (if available)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key available, using database data only");
      
      // Update subscriber record with current info if we have one
      if (existingSubscriber) {
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: existingSubscriber.stripe_customer_id,
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

        return new Response(JSON.stringify({
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // No existing data and no Stripe key
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe for subscription status
    try {
      // Make Stripe API call using fetch
      const customersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!customersResponse.ok) {
        throw new Error(`Stripe API error: ${customersResponse.status}`);
      }

      const customersData = await customersResponse.json();
      
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
        
        return new Response(JSON.stringify({ 
          subscribed: false,
          subscription_tier: null,
          subscription_end: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const customerId = customersData.data[0].id;
      logStep("Found Stripe customer", { customerId });

      // Get active subscriptions
      const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`, {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!subscriptionsResponse.ok) {
        throw new Error(`Stripe subscriptions API error: ${subscriptionsResponse.status}`);
      }

      const subscriptionsData = await subscriptionsResponse.json();
      const hasActiveSub = subscriptionsData.data.length > 0;
      let subscriptionTier = null;
      let subscriptionEnd = null;

      if (hasActiveSub) {
        const subscription = subscriptionsData.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Get price details
        const priceId = subscription.items.data[0].price.id;
        const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const amount = priceData.unit_amount || 0;
          
          // €12 = 1200 cents for Starter, €25 = 2500 cents for Pro
          if (amount >= 2500) {
            subscriptionTier = "Pro";
          } else if (amount >= 1200) {
            subscriptionTier = "Starter";
          } else {
            subscriptionTier = "Basic";
          }
        }
        
        logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, tier: subscriptionTier });
      } else {
        logStep("No active subscription found");
      }

      // Update subscriber record
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
      return new Response(JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
      
    } catch (stripeError) {
      logStep("Stripe API error, falling back to database", { error: stripeError.message });
      
      // If Stripe fails, use database data if available
      if (existingSubscriber) {
        return new Response(JSON.stringify({
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // Fallback to no subscription
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      subscribed: false,
      subscription_tier: null,
      subscription_end: null,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
