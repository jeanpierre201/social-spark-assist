
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

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
  tier_counts: {
    Free: number;
    Starter: number;
    Pro: number;
  };
}

export const useAnalytics = () => {
  const { userRole, loading: roleLoading, isAdmin } = useUserRole();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionAnalytics[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeAnalytics[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [contentData, setContentData] = useState<ContentAnalytics[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats>({ 
    total_active_subscribers: 0, 
    total_posts: 0,
    tier_counts: { Free: 0, Starter: 0, Pro: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    if (roleLoading || hasAttemptedFetch) {
      return;
    }
    
    if (!isAdmin()) {
      setLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch subscription analytics data
        const { data: subscriptionAnalytics, error: subError } = await supabase
          .from('subscription_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        if (subError) {
          console.error('Error fetching subscription analytics:', subError);
        }

        // Fetch income analytics data
        const { data: incomeAnalytics, error: incomeError } = await supabase
          .from('income_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        if (incomeError) {
          console.error('Error fetching income analytics:', incomeError);
        }

        // Fetch user activity data
        const { data: userActivityAnalytics, error: userError } = await supabase
          .from('user_activity_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        if (userError) {
          console.error('Error fetching user activity analytics:', userError);
        }

        // Fetch content analytics data
        const { data: contentAnalytics, error: contentError } = await supabase
          .from('content_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        if (contentError) {
          console.error('Error fetching content analytics:', contentError);
        }

        // Fetch current real stats (include all users, not just subscribed=true)
        const { data: subscribersData, error: subscribersError } = await supabase
          .from('subscribers')
          .select('*');

        if (subscribersError) {
          console.error('Error fetching current subscribers:', subscribersError);
        } else {
          console.log('Fetched subscribers data:', subscribersData);
        }

        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id');

        if (postsError) {
          console.error('Error fetching total posts:', postsError);
        } else {
          console.log('Fetched posts data:', postsData);
        }

        // Set current stats using real data only (count all users including Free tier)
        const allUsers = subscribersData || [];
        
        // Calculate tier counts from real subscribers data
        const tierCounts = {
          Free: allUsers.filter((s: any) => s.subscription_tier === 'Free' || !s.subscription_tier).length,
          Starter: allUsers.filter((s: any) => s.subscription_tier === 'Starter').length,
          Pro: allUsers.filter((s: any) => s.subscription_tier === 'Pro').length,
        };
        
        const currentStatsData = {
          total_active_subscribers: allUsers.length,
          total_posts: postsData?.length || 0,
          tier_counts: tierCounts
        };
        
        console.log('Setting current stats:', currentStatsData);
        console.log('Tier breakdown:', tierCounts);
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

        console.log('Successfully fetched real analytics data from database');

      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Still set mock data on error
        setSubscriptionData([]);
        setIncomeData([]);
        setUserActivityData([]);
        setContentData([]);
      } finally {
        setLoading(false);
        setHasAttemptedFetch(true);
      }
    };

    fetchAnalytics();
  }, [roleLoading, isAdmin, hasAttemptedFetch]);

  return {
    subscriptionData,
    incomeData,
    userActivityData,
    contentData,
    currentStats,
    loading,
    refetch: () => {
      // Re-trigger the effect by updating a dependency if needed
    }
  };
};
