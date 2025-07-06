
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

export const useAnalytics = () => {
  const { isAdmin } = useUserRole();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionAnalytics[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeAnalytics[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [contentData, setContentData] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch subscription analytics
        const { data: subscriptionAnalytics } = await supabase
          .from('subscription_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        // Fetch income analytics
        const { data: incomeAnalytics } = await supabase
          .from('income_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        // Fetch user activity data
        const { data: activityData } = await supabase
          .from('daily_user_activity')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        // Fetch content generation analytics
        const { data: contentAnalytics } = await supabase
          .from('content_generation_analytics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(30);

        setSubscriptionData(subscriptionAnalytics || []);
        setIncomeData(incomeAnalytics || []);
        setUserActivityData(activityData || []);
        setContentData(contentAnalytics || []);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAdmin]);

  return {
    subscriptionData,
    incomeData,
    userActivityData,
    contentData,
    loading,
    refetch: () => {
      // Re-trigger the effect by updating a dependency if needed
    }
  };
};
