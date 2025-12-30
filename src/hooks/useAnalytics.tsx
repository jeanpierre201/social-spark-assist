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
  active_users: number;
  tier_counts: {
    Free: number;
    Starter: number;
    Pro: number;
  };
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
    active_users: 0,
    tier_counts: { Free: 0, Starter: 0, Pro: 0 }
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

      // Fetch total posts count
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id');

      if (postsError) {
        console.error('Error fetching total posts:', postsError);
      }

      // Fetch published posts count
      const { data: publishedPostsData, error: publishedError } = await supabase
        .from('posts')
        .select('id')
        .eq('status', 'published');

      if (publishedError) {
        console.error('Error fetching published posts:', publishedError);
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
      
      // Calculate tier counts from real subscribers data
      const tierCounts = {
        Free: allUsers.filter((s: any) => s.subscription_tier === 'Free' || !s.subscription_tier).length,
        Starter: allUsers.filter((s: any) => s.subscription_tier === 'Starter').length,
        Pro: allUsers.filter((s: any) => s.subscription_tier === 'Pro').length,
      };

      // Active users = users who created posts in the date range, or fall back to total subscribers
      const activeUsersCount = uniqueActiveUserIds.size > 0 
        ? uniqueActiveUserIds.size 
        : allUsers.length;
      
      const currentStatsData = {
        total_active_subscribers: allUsers.length,
        total_posts: postsData?.length || 0,
        published_posts: publishedPostsData?.length || 0,
        active_users: activeUsersCount,
        tier_counts: tierCounts
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
