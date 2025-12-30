import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log('Fetching Stripe revenue data...');

    // Get date range from request or default to last 30 days
    const { fromDate, toDate } = await req.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    
    const startTimestamp = fromDate ? Math.floor(new Date(fromDate).getTime() / 1000) : thirtyDaysAgo;
    const endTimestamp = toDate ? Math.floor(new Date(toDate).getTime() / 1000) : now;

    // Fetch successful payments/charges in the date range
    const charges = await stripe.charges.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    });

    console.log(`Found ${charges.data.length} charges`);

    // Calculate total revenue from successful charges
    const successfulCharges = charges.data.filter(c => c.status === 'succeeded' && !c.refunded);
    const totalRevenue = successfulCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100; // Convert cents to euros
    const totalTransactions = successfulCharges.length;

    // Fetch active subscriptions for MRR calculation
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    console.log(`Found ${subscriptions.data.length} active subscriptions`);

    // Calculate MRR from active subscriptions
    let mrr = 0;
    let starterCount = 0;
    let proCount = 0;

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount || 0;
        const interval = item.price.recurring?.interval;
        
        // Convert to monthly amount
        let monthlyAmount = amount / 100; // cents to euros
        if (interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        }
        
        mrr += monthlyAmount;

        // Categorize by price (Starter ~€12, Pro ~€25)
        if (monthlyAmount >= 20) {
          proCount++;
        } else if (monthlyAmount >= 10) {
          starterCount++;
        }
      }
    }

    // Fetch recent successful payments for transaction list
    const recentPayments = await stripe.paymentIntents.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 50,
    });

    const successfulPayments = recentPayments.data
      .filter(p => p.status === 'succeeded')
      .map(p => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        created: new Date(p.created * 1000).toISOString(),
        customer: p.customer,
        description: p.description,
      }));

    // Fetch balance
    const balance = await stripe.balance.retrieve();
    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    // Calculate daily revenue breakdown
    const dailyRevenue: Record<string, number> = {};
    for (const charge of successfulCharges) {
      const date = new Date(charge.created * 1000).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (charge.amount / 100);
    }

    const revenueData = {
      // Summary stats
      totalRevenue,
      mrr,
      totalTransactions,
      activeSubscriptions: subscriptions.data.length,
      
      // Subscriber breakdown
      subscriberCounts: {
        starter: starterCount,
        pro: proCount,
      },
      
      // Balance
      availableBalance,
      pendingBalance,
      
      // Recent transactions
      recentPayments: successfulPayments,
      
      // Daily breakdown
      dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
        date,
        amount,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      
      // Annual projections
      annualRunRate: mrr * 12,
      
      // Average revenue per subscriber
      avgRevenuePerSubscriber: subscriptions.data.length > 0 
        ? mrr / subscriptions.data.length 
        : 0,
    };

    console.log('Stripe revenue data fetched successfully:', {
      totalRevenue,
      mrr,
      activeSubscriptions: subscriptions.data.length,
    });

    return new Response(
      JSON.stringify(revenueData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Stripe revenue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
