import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';
import SocialMediaSettings from './SocialMediaSettings';
import NavigationTabs from './content/NavigationTabs';
import { usePostsManager } from '@/hooks/usePostsManager';
import UsageIndicators from './starter/UsageIndicators';
import ContentGenerationForm from './content/ContentGenerationForm';
import PostsDisplay from './content/PostsDisplay';
import ProContentCreationForm from './dashboard/ProContentCreationForm';
import ProPostsSection from './dashboard/ProPostsSection';
import DashboardHeader from './dashboard/DashboardHeader';
import QuickStats from './dashboard/QuickStats';
import ActionCards from './dashboard/ActionCards';
import UpgradePrompt from './dashboard/UpgradePrompt';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { accounts, metrics } = useSocialAccounts();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // Get tab from URL or default to 'overview'
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    return ['overview', 'content-generator', 'analytics', 'team', 'social-accounts'].includes(hash) 
      ? hash 
      : 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const socialAccountsRef = useRef<HTMLDivElement>(null);

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
  const [daysRemaining, setDaysRemaining] = useState(30);

  // Get subscription start date
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

  // Update tab when hash changes
  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [location.hash]);

  // Update URL hash when tab changes
  React.useEffect(() => {
    if (activeTab !== 'overview') {
      window.location.hash = activeTab;
    } else {
      window.location.hash = '';
    }
  }, [activeTab]);

  // Check if we're coming from content generator
  const isFromContentGenerator = location.pathname === '/dashboard' && location.state?.fromContentGenerator;

  console.log('Dashboard: Current subscription info', { subscribed, subscriptionTier, isProUser, isStarterUser });

  const handleContentGeneration = () => {
    console.log('Navigating to content generator for user:', { subscriptionTier, subscribed });
    if (isProUser) {
      navigate('/content-generator');
    } else if (isStarterUser) {
      navigate('/content-generator-starter');
    } else {
      navigate('/content-generator');
    }
  };

  const handleViewAllPosts = () => {
    if (isProUser) {
      navigate('/content-generator', { state: { scrollToPosts: true } });
    } else if (isStarterUser) {
      navigate('/content-generator-starter', { state: { scrollToPosts: true } });
    } else {
      navigate('/content-generator', { state: { scrollToPosts: true } });
    }
  };

  const handleCalendarView = () => {
    if (isProUser) {
      navigate('/content-generator', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    } else if (isStarterUser) {
      navigate('/content-generator-starter', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    } else {
      navigate('/content-generator', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    }
  };

  const handleConnectAccounts = () => {
    if (isProUser) {
      setActiveTab('social');
    } else {
      setActiveTab('social');
      // Scroll to social accounts section after a brief delay to ensure it's rendered
      setTimeout(() => {
        socialAccountsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        });
      }, 100);
    }
  };

  // Content Generator handlers
  const handleEditPost = (post: any) => {
    // This could be expanded to open an edit modal or form
    console.log('Edit post:', post);
  };

  const handleUpdatePost = async (post: any, newContent: string) => {
    updatePostMutation.mutate({ 
      id: post.id, 
      content: newContent,
      scheduled_date: post.scheduled_date,
      scheduled_time: post.scheduled_time
    });
  };

  const handleDeletePost = async (id: string) => {
    deletePostMutation.mutate(id);
  };

  const handlePostCreated = (newPost: any) => {
    createPostMutation.mutate(newPost);
  };

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

  // Determine if we should show the Content Generator tab in NavigationTabs
  const shouldShowContentGeneratorTab = !isFromContentGenerator;

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} />

        {/* Navigation Tabs for Pro Users Only */}
        <NavigationTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isProUser={isProUser}
          showContentGenerator={shouldShowContentGeneratorTab}
        />

        {/* Tab Content for Pro Users */}
        {isProUser && activeTab === 'content-generator' && (
          <>
            {/* Usage Indicators */}
            <UsageIndicators 
              monthlyPosts={currentMonthPosts} 
              daysRemaining={daysRemaining}
              maxPosts={100}
              isProPlan={isProUser}
              subscriptionStartDate={subscriptionStartDate}
            />

            {/* Content Generation Form */}
            <div className="mb-6">
              <ProContentCreationForm
                monthlyPosts={currentMonthPosts}
                setMonthlyPosts={(value) => {
                  // This is handled by the hook, so we don't need to update here
                }}
                canCreatePosts={isProUser}
                setPosts={(value) => {
                  // This is handled by the hook, so we don't need to update here
                }}
                onPostCreated={() => {
                  // Refresh the posts query when a new post is created
                  queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
                }}
              />
            </div>

            {/* Display Generated Posts - Pro Version */}
            <ProPostsSection
              onEditPost={handleEditPost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          </>
        )}
        {isProUser && activeTab === 'analytics' && <ProAnalytics />}
        {isProUser && activeTab === 'team' && <TeamCollaboration />}
        {isProUser && activeTab === 'social-accounts' && <SocialMediaSettings />}
        
        {/* Overview Tab or Default View */}
        {(!isProUser || activeTab === 'overview') && (
          <>
            {/* Quick Stats - Only show for subscribed users */}
            <QuickStats 
              isProUser={isProUser}
              isStarterUser={isStarterUser}
              subscribed={subscribed}
              totalPosts={totalPosts}
              currentMonthPosts={currentMonthPosts}
              avgEngagementRate={avgEngagementRate}
              totalScheduledPosts={totalScheduledPosts}
              totalFollowers={totalFollowers}
            />

            {/* Action Cards */}
            <ActionCards 
              isProUser={isProUser}
              isStarterUser={isStarterUser}
              hasAnyPlan={hasAnyPlan}
              onContentGeneration={handleContentGeneration}
              onViewAllPosts={handleViewAllPosts}
              onCalendarView={handleCalendarView}
              onConnectAccounts={handleConnectAccounts}
              onSetActiveTab={setActiveTab}
            />

            {/* Show Social Accounts tab for Starter users */}
            {isStarterUser && activeTab === 'social' && (
              <div className="mt-8" ref={socialAccountsRef}>
                <SocialMediaSettings />
              </div>
            )}

            {/* Upgrade Prompts for non-subscribed users only */}
            {!subscribed && <UpgradePrompt />}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
