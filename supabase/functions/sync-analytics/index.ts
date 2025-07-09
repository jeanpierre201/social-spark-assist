import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-ANALYTICS] ${step}${detailsStr}`);
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
    logStep("Starting analytics sync");
    const today = new Date().toISOString().split('T')[0];

    // Sync subscription analytics
    await syncSubscriptionAnalytics(supabaseClient, today);
    
    // Sync content analytics
    await syncContentAnalytics(supabaseClient, today);
    
    // Sync user activity analytics
    await syncUserActivityAnalytics(supabaseClient, today);

    logStep("Analytics sync completed");

    return new Response(JSON.stringify({ success: true, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-analytics", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function syncSubscriptionAnalytics(supabaseClient: any, date: string) {
  logStep("Syncing subscription analytics");

  // Get current active subscribers by tier
  const { data: subscribers, error } = await supabaseClient
    .from("subscribers")
    .select("subscription_tier")
    .eq("subscribed", true);

  if (error) {
    logStep("Error fetching subscribers", { error: error.message });
    return;
  }

  // Count by tier
  const tierCounts = subscribers.reduce((acc: any, sub: any) => {
    const tier = sub.subscription_tier || "Basic";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  // Update analytics for each tier
  for (const [tier, count] of Object.entries(tierCounts)) {
    const { error: upsertError } = await supabaseClient
      .from("subscription_analytics")
      .upsert({
        date_recorded: date,
        subscription_tier: tier,
        active_subscriptions: count,
        new_subscriptions: 0, // This should be updated by webhooks
        revenue_generated: 0, // This should be updated by webhooks
        upgrade_count: 0,
        downgrade_count: 0,
      }, { 
        onConflict: 'date_recorded,subscription_tier',
        ignoreDuplicates: false
      });

    if (upsertError) {
      logStep("Error upserting subscription analytics", { tier, error: upsertError.message });
    }
  }

  logStep("Subscription analytics synced", { tierCounts });
}

async function syncContentAnalytics(supabaseClient: any, date: string) {
  logStep("Syncing content analytics");

  // Get total posts count
  const { data: posts, error: postsError } = await supabaseClient
    .from("posts")
    .select("id, user_id, created_at")
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lt("created_at", `${new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`);

  if (postsError) {
    logStep("Error fetching posts", { error: postsError.message });
    return;
  }

  // Get posts by tier (simplified - assuming we can get user tiers)
  const postsByTier = { "Starter": 0, "Pro": 0, "Basic": 0 };
  
  // Get user tiers for post creators
  if (posts.length > 0) {
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    const { data: userTiers } = await supabaseClient
      .from("subscribers")
      .select("user_id, subscription_tier")
      .in("user_id", userIds)
      .eq("subscribed", true);

    const tierMap = (userTiers || []).reduce((acc: any, ut: any) => {
      acc[ut.user_id] = ut.subscription_tier || "Basic";
      return acc;
    }, {});

    posts.forEach((post: any) => {
      const tier = tierMap[post.user_id] || "Basic";
      postsByTier[tier as keyof typeof postsByTier]++;
    });
  }

  const { error: contentError } = await supabaseClient
    .from("content_analytics")
    .upsert({
      date_recorded: date,
      total_posts_generated: posts.length,
      posts_by_tier: postsByTier,
      success_rate: 100, // Assuming all posts are successful
      popular_industries: ["tech", "business"], // Placeholder
      api_calls_count: posts.length,
      api_cost: posts.length * 0.01, // Estimated cost
    }, { onConflict: 'date_recorded' });

  if (contentError) {
    logStep("Error updating content analytics", { error: contentError.message });
  } else {
    logStep("Content analytics synced", { postsCount: posts.length, postsByTier });
  }
}

async function syncUserActivityAnalytics(supabaseClient: any, date: string) {
  logStep("Syncing user activity analytics");

  // Get new users for today (simplified)
  const { data: newUsers, error: newUsersError } = await supabaseClient
    .from("profiles")
    .select("id")
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lt("created_at", `${new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`);

  if (newUsersError) {
    logStep("Error fetching new users", { error: newUsersError.message });
    return;
  }

  // Get total active users (users who created content today)
  const { data: activePosts, error: activeError } = await supabaseClient
    .from("posts")
    .select("user_id")
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lt("created_at", `${new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`);

  if (activeError) {
    logStep("Error fetching active users", { error: activeError.message });
    return;
  }

  const activeUserIds = [...new Set((activePosts || []).map((p: any) => p.user_id))];

  const { error: activityError } = await supabaseClient
    .from("user_activity_analytics")
    .upsert({
      date_recorded: date,
      total_active_users: activeUserIds.length,
      new_users: newUsers?.length || 0,
      returning_users: Math.max(0, activeUserIds.length - (newUsers?.length || 0)),
      total_sessions: activeUserIds.length * 2, // Estimated
      page_views: activeUserIds.length * 5, // Estimated
    }, { onConflict: 'date_recorded' });

  if (activityError) {
    logStep("Error updating user activity analytics", { error: activityError.message });
  } else {
    logStep("User activity analytics synced", { 
      activeUsers: activeUserIds.length, 
      newUsers: newUsers?.length || 0 
    });
  }
}