import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface SubscriptionAnalytics {
  date_recorded: string;
  subscription_tier: string;
  new_subscriptions: number;
  active_subscriptions: number;
  revenue_generated: number;
  upgrade_count: number;
  downgrade_count: number;
}

interface IncomeAnalytics {
  date_recorded: string;
  total_revenue: number;
  subscription_revenue: number;
  net_revenue: number;
  transaction_count: number;
  monthly_recurring_revenue: number;
}

interface UserActivityData {
  date_recorded: string;
  total_active_users: number;
  new_users: number;
  returning_users: number;
  total_sessions: number;
  page_views: number;
}

interface ContentAnalytics {
  date_recorded: string;
  total_posts_generated: number;
  posts_by_tier: Record<string, number>;
  success_rate: number;
  popular_industries: string[];
  api_calls_count: number;
  api_cost: number;
}

interface CurrentStats {
  total_active_subscribers: number;
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  active_users: number;
  tier_counts: {
    Free: number;
    Starter: number;
    Pro: number;
  };
  // Revenue stats calculated from real subscribers
  mrr: number; // Monthly Recurring Revenue
  estimated_revenue: number; // Based on active paid subscribers
  paid_subscribers: number; // Subscribers with Stripe billing
  promo_subscribers: number; // Subscribers with promo codes (no Stripe billing)
  // Content creation costs
  content_costs: {
    total_text_generations: number;
    total_image_generations: number;
    estimated_text_cost: number; // Based on OpenAI pricing
    estimated_image_cost: number; // Based on image generation pricing
    total_cost: number;
  };
  // Posts by tier (real-time)
  posts_by_tier: {
    Free: number;
    Starter: number;
    Pro: number;
  };
  // Industry breakdown
  industries: { name: string; count: number }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

interface UseAnalyticsOptions {
  dateRange?: DateRange;
  enabled?: boolean;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { dateRange, enabled = true } = options;
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionAnalytics[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeAnalytics[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [contentData, setContentData] = useState<ContentAnalytics[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats>({ 
    total_active_subscribers: 0, 
    total_posts: 0,
    published_posts: 0,
    scheduled_posts: 0,
    draft_posts: 0,
    active_users: 0,
    tier_counts: { Free: 0, Starter: 0, Pro: 0 },
    mrr: 0,
    estimated_revenue: 0,
    paid_subscribers: 0,
    promo_subscribers: 0,
    content_costs: {
      total_text_generations: 0,
      total_image_generations: 0,
      estimated_text_cost: 0,
      estimated_image_cost: 0,
      total_cost: 0
    },
    posts_by_tier: { Free: 0, Starter: 0, Pro: 0 },
    industries: []
  });
  
  // Split loading states: initialLoading for first fetch, refreshing for subsequent
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  // Memoize date strings to prevent unnecessary re-renders
  const fromDateStr = useMemo(() => 
    dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    [dateRange?.from?.getTime()]
  );
  
  const toDateStr = useMemo(() => 
    dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    [dateRange?.to?.getTime()]
  );

  const fetchAnalytics = useCallback(async () => {
    if (!enabled) {
      setInitialLoading(false);
      return;
    }

    try {
      // Use refreshing state for subsequent fetches, initialLoading for first
      if (hasFetched.current) {
        setRefreshing(true);
      }

      // Fetch subscription analytics data with date filter
      const { data: subscriptionAnalytics, error: subError } = await supabase
        .from('subscription_analytics')
        .select('*')
        .gte('date_recorded', fromDateStr)
        .lte('date_recorded', toDateStr)
        .order('date_recorded', { ascending: false });

      if (subError) {
        console.error('Error fetching subscription analytics:', subError);
      }

      // Fetch income analytics data with date filter
      const { data: incomeAnalytics, error: incomeError } = await supabase
        .from('income_analytics')
        .select('*')
        .gte('date_recorded', fromDateStr)
        .lte('date_recorded', toDateStr)
        .order('date_recorded', { ascending: false });

      if (incomeError) {
        console.error('Error fetching income analytics:', incomeError);
      }

      // Fetch user activity data with date filter
      const { data: userActivityAnalytics, error: userError } = await supabase
        .from('user_activity_analytics')
        .select('*')
        .gte('date_recorded', fromDateStr)
        .lte('date_recorded', toDateStr)
        .order('date_recorded', { ascending: false });

      if (userError) {
        console.error('Error fetching user activity analytics:', userError);
      }

      // Fetch content analytics data with date filter
      const { data: contentAnalytics, error: contentError } = await supabase
        .from('content_analytics')
        .select('*')
        .gte('date_recorded', fromDateStr)
        .lte('date_recorded', toDateStr)
        .order('date_recorded', { ascending: false });

      if (contentError) {
        console.error('Error fetching content analytics:', contentError);
      }

      // Fetch current real stats (include all users, not just subscribed=true)
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*');

      if (subscribersError) {
        console.error('Error fetching current subscribers:', subscribersError);
      }

      // Fetch all posts with details for comprehensive content analytics
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, status, user_id, industry, ai_generations_count, ai_generated_image_1_url, ai_generated_image_2_url');

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

      // Fetch posts in date range to calculate active users (users who created posts)
      const { data: postsInRangeData, error: postsInRangeError } = await supabase
        .from('posts')
        .select('user_id')
        .gte('created_at', fromDateStr)
        .lte('created_at', toDateStr + 'T23:59:59');

      if (postsInRangeError) {
        console.error('Error fetching posts in range:', postsInRangeError);
      }

      // Calculate unique active users from posts in date range
      const uniqueActiveUserIds = new Set(
        (postsInRangeData || []).map((p: any) => p.user_id).filter(Boolean)
      );

      // Set current stats using real data only (count all users including Free tier)
      const allUsers = subscribersData || [];
      const allPosts = postsData || [];
      
      // Calculate tier counts from real subscribers data
      const activeStarterUsers = allUsers.filter((s: any) => 
        s.subscription_tier === 'Starter' && s.subscribed === true
      );
      const activeProUsers = allUsers.filter((s: any) => 
        s.subscription_tier === 'Pro' && s.subscribed === true
      );
      const freeUsers = allUsers.filter((s: any) => 
        s.subscription_tier === 'Free' || !s.subscription_tier || s.subscribed === false
      );

      const tierCounts = {
        Free: freeUsers.length,
        Starter: activeStarterUsers.length,
        Pro: activeProUsers.length,
      };

      // Calculate MRR from active paid subscribers with Stripe billing
      const STARTER_PRICE = 12;
      const PRO_PRICE = 25;
      
      const billedStarterUsers = allUsers.filter((s: any) => 
        s.subscription_tier === 'Starter' && s.subscribed === true && s.stripe_customer_id
      );
      const billedProUsers = allUsers.filter((s: any) => 
        s.subscription_tier === 'Pro' && s.subscribed === true && s.stripe_customer_id
      );
      
      const mrr = (billedStarterUsers.length * STARTER_PRICE) + (billedProUsers.length * PRO_PRICE);
      const paidSubscribers = billedStarterUsers.length + billedProUsers.length;
      
      // Promo subscribers: users with subscribed=true but NO stripe_customer_id
      const promoSubscribers = allUsers.filter((s: any) => 
        s.subscribed === true && 
        s.subscription_tier && 
        s.subscription_tier !== 'Free' && 
        !s.stripe_customer_id
      );

      // Calculate post counts by status
      const publishedPosts = allPosts.filter((p: any) => p.status === 'published').length;
      const scheduledPosts = allPosts.filter((p: any) => p.status === 'scheduled').length;
      const draftPosts = allPosts.filter((p: any) => p.status === 'draft' || !p.status).length;

      // Calculate content creation costs
      // Text generation: ~$0.002 per post (GPT-4o-mini average)
      // Image generation: ~$0.04 per image (DALL-E 3)
      const TEXT_COST_PER_GENERATION = 0.002;
      const IMAGE_COST_PER_IMAGE = 0.04;
      
      const totalTextGenerations = allPosts.reduce((sum: number, p: any) => 
        sum + (p.ai_generations_count || 1), 0
      );
      const totalImageGenerations = allPosts.reduce((sum: number, p: any) => {
        let count = 0;
        if (p.ai_generated_image_1_url) count++;
        if (p.ai_generated_image_2_url) count++;
        return sum + count;
      }, 0);
      
      const estimatedTextCost = totalTextGenerations * TEXT_COST_PER_GENERATION;
      const estimatedImageCost = totalImageGenerations * IMAGE_COST_PER_IMAGE;

      // Calculate posts by tier (match post user_id to subscriber tier)
      const userTierMap = new Map(
        allUsers.map((s: any) => [s.user_id, s.subscription_tier || 'Free'])
      );
      
      const postsByTier = {
        Free: 0,
        Starter: 0,
        Pro: 0
      };
      
      allPosts.forEach((p: any) => {
        const tier = userTierMap.get(p.user_id) || 'Free';
        if (tier === 'Starter') postsByTier.Starter++;
        else if (tier === 'Pro') postsByTier.Pro++;
        else postsByTier.Free++;
      });

      // Calculate industry breakdown
      const industryMap = new Map<string, number>();
      allPosts.forEach((p: any) => {
        if (p.industry) {
          industryMap.set(p.industry, (industryMap.get(p.industry) || 0) + 1);
        }
      });
      const industries = Array.from(industryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Active users = users who created posts in the date range
      const activeUsersCount = uniqueActiveUserIds.size > 0 
        ? uniqueActiveUserIds.size 
        : allUsers.length;
      
      const currentStatsData: CurrentStats = {
        total_active_subscribers: allUsers.length,
        total_posts: allPosts.length,
        published_posts: publishedPosts,
        scheduled_posts: scheduledPosts,
        draft_posts: draftPosts,
        active_users: activeUsersCount,
        tier_counts: tierCounts,
        mrr: mrr,
        estimated_revenue: mrr,
        paid_subscribers: paidSubscribers,
        promo_subscribers: promoSubscribers.length,
        content_costs: {
          total_text_generations: totalTextGenerations,
          total_image_generations: totalImageGenerations,
          estimated_text_cost: estimatedTextCost,
          estimated_image_cost: estimatedImageCost,
          total_cost: estimatedTextCost + estimatedImageCost
        },
        posts_by_tier: postsByTier,
        industries: industries
      };
      
      setCurrentStats(currentStatsData);

      // Transform and set the data
      setSubscriptionData(subscriptionAnalytics?.map(item => ({
        date_recorded: item.date_recorded,
        subscription_tier: item.subscription_tier,
        new_subscriptions: item.new_subscriptions,
        active_subscriptions: item.active_subscriptions,
        revenue_generated: Number(item.revenue_generated),
        upgrade_count: item.upgrade_count,
        downgrade_count: item.downgrade_count
      })) || []);

      setIncomeData(incomeAnalytics?.map(item => ({
        date_recorded: item.date_recorded,
        total_revenue: Number(item.total_revenue),
        subscription_revenue: Number(item.subscription_revenue),
        net_revenue: Number(item.net_revenue),
        transaction_count: item.transaction_count,
        monthly_recurring_revenue: Number(item.monthly_recurring_revenue)
      })) || []);

      setUserActivityData(userActivityAnalytics?.map(item => ({
        date_recorded: item.date_recorded,
        total_active_users: item.total_active_users,
        new_users: item.new_users,
        returning_users: item.returning_users,
        total_sessions: item.total_sessions,
        page_views: item.page_views
      })) || []);

      setContentData(contentAnalytics?.map(item => ({
        date_recorded: item.date_recorded,
        total_posts_generated: item.total_posts_generated,
        posts_by_tier: item.posts_by_tier as Record<string, number>,
        success_rate: Number(item.success_rate),
        popular_industries: item.popular_industries,
        api_calls_count: item.api_calls_count,
        api_cost: Number(item.api_cost)
      })) || []);

      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setSubscriptionData([]);
      setIncomeData([]);
      setUserActivityData([]);
      setContentData([]);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [enabled, fromDateStr, toDateStr]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    subscriptionData,
    incomeData,
    userActivityData,
    contentData,
    currentStats,
    initialLoading,
    refreshing,
    // Keep 'loading' for backward compatibility (true only during initial load)
    loading: initialLoading,
    refetch: fetchAnalytics
  };
};
