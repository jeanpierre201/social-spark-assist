import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePostsManager } from '@/hooks/usePostsManager';
import DashboardHeader from './dashboard/DashboardHeader';
import ProDashboardNav from './dashboard/ProDashboardNav';
import QuickStats from './dashboard/QuickStats';
import ActionCards from './dashboard/ActionCards';
import UpgradePrompt from './dashboard/UpgradePrompt';
import FreeSocialMediaSettings from './FreeSocialMediaSettings';

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
        {isProUser && <ProDashboardNav />}

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
          
          {/* Free User Layout: Vertical Stack */}
          {!hasAnyPlan ? (
            <>
               <ActionCards
                isProUser={isProUser}
                isStarterUser={isStarterUser}
                hasAnyPlan={hasAnyPlan}
                onContentGeneration={() => navigate('/content-generator')}
                onViewAllPosts={() => {}}
                onCalendarView={() => {}}
                onConnectAccounts={() => {}}
                onSetActiveTab={(tab) => {
                  if (tab === 'content') navigate('/dashboard/content');
                  else if (tab === 'social') navigate('/dashboard/social');
                  else if (tab === 'analytics') navigate('/dashboard/analytics');
                  else if (tab === 'team') navigate('/dashboard/team');
                }}
              />
              
              {/* Social accounts for free users - only Mastodon & Telegram */}
              <FreeSocialMediaSettings />
              
              <UpgradePrompt />
            </>
          ) : isStarterUser ? (
            /* Starter User Layout: Vertical Stack (Full Width) */
            <>
              <ActionCards
                isProUser={isProUser}
                isStarterUser={isStarterUser}
                hasAnyPlan={hasAnyPlan}
                onContentGeneration={() => navigate('/dashboard/content-generator-starter')}
                onViewAllPosts={() => navigate('/dashboard/posts-starter')}
                onCalendarView={() => navigate('/dashboard/posts-starter', { state: { viewMode: 'calendar' } })}
                onConnectAccounts={() => navigate('/dashboard/social')}
                onSocial={() => navigate('/dashboard/social')}
                onSubscription={() => navigate('/dashboard/subscription')}
                onSetActiveTab={() => {}}
              />
            </>
          ) : (
            /* Pro User Layout */
            <ActionCards
                  isProUser={isProUser}
                  isStarterUser={isStarterUser}
                  hasAnyPlan={hasAnyPlan}
                  onContentGeneration={() => navigate('/dashboard/content-generator-pro')}
                  onViewAllPosts={() => navigate('/dashboard/posts-pro')}
                  onCalendarView={() => navigate('/dashboard/posts-pro', { state: { viewMode: 'calendar' } })}
                  onConnectAccounts={() => navigate('/dashboard/social')}
                  onBrand={() => navigate('/dashboard/brand')}
                  onCampaigns={() => navigate('/dashboard/campaigns')}
                  onSocial={() => navigate('/dashboard/social')}
                  onSubscription={() => navigate('/dashboard/subscription')}
                  onSetActiveTab={(tab) => {
                    if (tab === 'content') navigate('/dashboard/content-generator-pro');
                    else if (tab === 'social') navigate('/dashboard/social');
                    else if (tab === 'analytics') navigate('/dashboard/analytics');
                    else if (tab === 'team') navigate('/dashboard/team');
                  }}
                />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;