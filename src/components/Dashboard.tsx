import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePostsManager } from '@/hooks/usePostsManager';
import DashboardHeader from './dashboard/DashboardHeader';
import QuickStats from './dashboard/QuickStats';
import ActionCards from './dashboard/ActionCards';
import UpgradePrompt from './dashboard/UpgradePrompt';
import SubscriptionManagement from './dashboard/SubscriptionManagement';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { accounts, metrics } = useSocialAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (subscriptionTier === 'Pro' || subscriptionTier === 'Starter');

  // Add posts manager for content generation
  const {
    posts,
    currentMonthPosts,
    postLimit,
    createPostMutation,
    updatePostMutation,
    deletePostMutation,
    isFreeUser
  } = usePostsManager();

  // Fetch subscription start date for Pro users
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(30);

  React.useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user || !isProUser) return;
      
      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('created_at, updated_at')
          .eq('user_id', user.id)
          .eq('subscribed', true)
          .eq('subscription_tier', 'Pro')
          .single();

        if (error) {
          console.error('Error fetching subscription data:', error);
          return;
        }

        if (data) {
          const startDate = new Date(data.created_at);
          setSubscriptionStartDate(data.created_at);
          
          // Calculate days remaining (30 days from subscription start)
          const now = new Date();
          const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const remaining = Math.max(0, 30 - daysSinceStart);
          setDaysRemaining(remaining);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    fetchSubscriptionData();
  }, [user, isProUser]);

  // Calculate real metrics - only show for subscribed users
  const totalFollowers = subscribed ? metrics.reduce((sum, metric) => sum + (metric.followers_count || 0), 0) : 0;
  const totalPosts = subscribed ? posts.length : 0;
  const avgEngagementRate = subscribed && metrics.length > 0 
    ? (metrics.reduce((sum, metric) => sum + (metric.engagement_rate || 0), 0) / metrics.length).toFixed(1)
    : null;
  
  // Calculate scheduled posts (posts with future scheduled date/time) - only for subscribed users
  const now = new Date();
  const scheduledPosts = subscribed ? posts.filter(post => {
    if (!post.scheduled_date || !post.scheduled_time) return false;
    const scheduledDateTime = new Date(`${post.scheduled_date}T${post.scheduled_time}`);
    return scheduledDateTime > now;
  }) : [];
  const totalScheduledPosts = scheduledPosts.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} showDashboardButton={false} />

        {/* Navigation tabs for Pro users only */}
        {isProUser && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  className="border-purple-500 text-purple-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Overview
                </button>
                <button
                  onClick={() => navigate('/dashboard/content')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Content Generator
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Advanced Analytics
                </button>
                <button
                  onClick={() => navigate('/dashboard/team')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Team Collaboration
                </button>
                <button
                  onClick={() => navigate('/dashboard/social')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Social Accounts
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Overview Content */}
        <div className="space-y-6">
          <QuickStats 
            totalFollowers={totalFollowers}
            totalPosts={totalPosts}
            avgEngagementRate={avgEngagementRate}
            totalScheduledPosts={totalScheduledPosts}
            isProUser={isProUser}
            isStarterUser={isStarterUser}
            subscribed={subscribed}
            currentMonthPosts={currentMonthPosts}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActionCards
            isProUser={isProUser}
            isStarterUser={isStarterUser}
            hasAnyPlan={hasAnyPlan}
            onContentGeneration={() => {
              if (isProUser) {
                navigate('/dashboard/content');
              } else if (isStarterUser) {
                navigate('/content-generator-starter');
              } else {
                navigate('/dashboard/content');
              }
            }}
            onViewAllPosts={() => {
              if (isProUser) {
                navigate('/dashboard/content');
              } else if (isStarterUser) {
                navigate('/content-generator-starter');
              } else {
                navigate('/dashboard/content');
              }
            }}
            onCalendarView={() => {
              if (isProUser) {
                navigate('/dashboard/content');
              } else if (isStarterUser) {
                navigate('/content-generator-starter');
              } else {
                navigate('/dashboard/content');
              }
            }}
            onConnectAccounts={() => {
              if (isProUser) {
                navigate('/dashboard/social');
              } else {
                navigate('/dashboard/social');
              }
            }}
            onSetActiveTab={(tab: string) => {
              if (tab === 'content') navigate('/dashboard/content');
              else if (tab === 'analytics') navigate('/dashboard/analytics');
              else if (tab === 'team') navigate('/dashboard/team');
            }}
              />
            </div>
            
            <div className="lg:col-span-1">
              <SubscriptionManagement />
            </div>
          </div>

          {!hasAnyPlan && (
            <UpgradePrompt />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;