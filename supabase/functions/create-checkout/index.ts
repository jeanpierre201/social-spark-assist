
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if customer exists using native fetch
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
    let customerId;
    if (customersData.data.length > 0) {
      customerId = customersData.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Create checkout session using native fetch
    const sessionData = {
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?payment=cancelled`,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { 
            name: "Starter Plan",
            description: "Social media content generation with premium features"
          },
          unit_amount: 1200, // €12.00
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
    };

    // Add customer info
    if (customerId) {
      sessionData.customer = customerId;
    } else {
      sessionData.customer_email = user.email;
    }

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(Object.entries(sessionData).reduce((acc, [key, value]) => {
        if (key === 'line_items') {
          acc['line_items[0][price_data][currency]'] = value[0].price_data.currency;
          acc['line_items[0][price_data][product_data][name]'] = value[0].price_data.product_data.name;
          acc['line_items[0][price_data][product_data][description]'] = value[0].price_data.product_data.description;
          acc['line_items[0][price_data][unit_amount]'] = value[0].price_data.unit_amount.toString();
          acc['line_items[0][price_data][recurring][interval]'] = value[0].price_data.recurring.interval;
          acc['line_items[0][quantity]'] = value[0].quantity.toString();
        } else {
          acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return acc;
      }, {})),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      logStep("ERROR: Stripe checkout API failed", { status: sessionResponse.status, error: errorText });
      throw new Error(`Stripe API error: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionDataResponse = await sessionResponse.json();
    logStep("Checkout session created", { sessionId: sessionDataResponse.id, url: sessionDataResponse.url });

    return new Response(JSON.stringify({ url: sessionDataResponse.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
