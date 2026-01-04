import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Supabase not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create a Supabase client with service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Syncing subscribers with Stripe...');

    // Fetch all active subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer'],
    });

    console.log(`Found ${stripeSubscriptions.data.length} active Stripe subscriptions`);

    const stripeCustomerEmails = new Set<string>();
    const stripeCustomerData: Record<string, { 
      customerId: string; 
      tier: string; 
      subscriptionEnd: Date | null;
    }> = {};

    // Process Stripe subscriptions
    for (const sub of stripeSubscriptions.data) {
      const customer = sub.customer as Stripe.Customer;
      if (customer && customer.email) {
        stripeCustomerEmails.add(customer.email);
        
        // Determine tier based on price
        let tier = 'Starter';
        const priceAmount = sub.items.data[0]?.price?.unit_amount || 0;
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        
        let monthlyAmount = priceAmount / 100;
        if (interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        }
        
        if (monthlyAmount >= 20) {
          tier = 'Pro';
        }

        stripeCustomerData[customer.email] = {
          customerId: customer.id,
          tier,
          subscriptionEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        };
      }
    }

    // Fetch all subscribers marked as subscribed=true in database
    const { data: dbSubscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('subscribed', true);

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dbSubscribers?.length || 0} subscribers in database with subscribed=true`);

    let updated = 0;
    let deactivated = 0;
    let synced = 0;

    // Process each database subscriber
    for (const dbSub of dbSubscribers || []) {
      const stripeData = stripeCustomerData[dbSub.email];
      
      if (stripeData) {
        // Subscriber exists in Stripe - update their data
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            stripe_customer_id: stripeData.customerId,
            subscription_tier: stripeData.tier,
            subscription_end: stripeData.subscriptionEnd?.toISOString(),
            subscribed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbSub.id);

        if (updateError) {
          console.error(`Error updating subscriber ${dbSub.email}:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Subscriber not in Stripe active subscriptions - deactivate them
        // Check if they have a test customer ID or no customer ID
        const isTestUser = dbSub.stripe_customer_id?.startsWith('cus_test_') || !dbSub.stripe_customer_id;
        
        console.log(`Deactivating subscriber ${dbSub.email} (not found in Stripe, isTestUser: ${isTestUser})`);
        
        const { error: deactivateError } = await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_tier: 'Free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbSub.id);

        if (deactivateError) {
          console.error(`Error deactivating subscriber ${dbSub.email}:`, deactivateError);
        } else {
          deactivated++;
        }
      }
    }

    // Check for Stripe customers not in database and add them
    for (const email of stripeCustomerEmails) {
      const existing = (dbSubscribers || []).find(s => s.email === email);
      if (!existing) {
        const stripeData = stripeCustomerData[email];
        console.log(`Adding new subscriber from Stripe: ${email}`);
        
        const { error: insertError } = await supabase
          .from('subscribers')
          .insert({
            email,
            stripe_customer_id: stripeData.customerId,
            subscription_tier: stripeData.tier,
            subscription_end: stripeData.subscriptionEnd?.toISOString(),
            subscribed: true,
          });

        if (insertError) {
          console.error(`Error adding subscriber ${email}:`, insertError);
        } else {
          synced++;
        }
      }
    }

    const result = {
      success: true,
      stripeActiveSubscriptions: stripeSubscriptions.data.length,
      dbSubscribersProcessed: dbSubscribers?.length || 0,
      updated,
      deactivated,
      newFromStripe: synced,
    };

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing Stripe subscribers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
