import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NavigationTabs from '@/components/content/NavigationTabs';
import { usePostsManager } from '@/hooks/usePostsManager';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ContentGenerationForm from '@/components/content/ContentGenerationForm';
import PostsDisplay from '@/components/content/PostsDisplay';
import ProContentCreationForm from '@/components/dashboard/ProContentCreationForm';
import ProPostsSection from '@/components/dashboard/ProPostsSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';

const DashboardContentPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { accounts, metrics } = useSocialAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('content-generator');
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
  const [daysRemaining, setDaysRemaining] = useState<number>(30);
  const [monthlyPosts, setMonthlyPosts] = useState(0);

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

  // Fetch monthly usage for Pro users
  React.useEffect(() => {
    const fetchMonthlyUsage = async () => {
      if (!user || !isProUser) return;
      
      try {
        const { data, error } = await supabase
          .rpc('get_monthly_usage_count', { user_uuid: user.id });

        if (error) {
          console.error('Error fetching monthly usage:', error);
          return;
        }

        setMonthlyPosts(data || 0);
      } catch (error) {
        console.error('Error fetching monthly usage:', error);
      }
    };

    fetchMonthlyUsage();
  }, [user, isProUser]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} />

        {/* Navigation tabs for Pro users only */}
        {isProUser && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Overview
                </button>
                <button
                  className="border-purple-500 text-purple-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
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

        {/* Content based on user type */}
        {!hasAnyPlan ? (
          // Free users
          <div className="space-y-6">
            <UpgradePrompt />
            
            <UsageIndicators 
              monthlyPosts={currentMonthPosts}
              previousPeriodPosts={0}
              daysRemaining={30}
              maxPosts={postLimit}
              isProPlan={false}
              subscriptionStartDate={null}
              canCreatePosts={true}
            />

            <NavigationTabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              isProUser={false}
              showContentGenerator={true}
            />

            <div className="space-y-6">
              {activeTab === 'content-generator' && (
                <ContentGenerationForm 
                  currentMonthPosts={currentMonthPosts}
                  isProUser={false}
                  isStarterUser={false}
                  isFreeUser={true}
                  onPostCreated={handlePostCreated}
                />
              )}
              
              {activeTab === 'posts' && (
                <PostsDisplay 
                  posts={posts}
                  onEditPost={handleEditPost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                />
              )}
            </div>
          </div>
        ) : isProUser ? (
          // Pro users
          <div className="space-y-6">
            <UsageIndicators 
              monthlyPosts={monthlyPosts}
              previousPeriodPosts={0}
              daysRemaining={daysRemaining}
              maxPosts={100}
              isProPlan={true}
              subscriptionStartDate={subscriptionStartDate}
              canCreatePosts={monthlyPosts < 100}
            />

            <ProContentCreationForm 
              monthlyPosts={monthlyPosts}
              setMonthlyPosts={setMonthlyPosts}
              canCreatePosts={monthlyPosts < 100}
              setPosts={() => {}}
              onPostCreated={() => {
                // Refresh usage count
                const fetchUsage = async () => {
                  const { data } = await supabase.rpc('get_monthly_usage_count', { user_uuid: user!.id });
                  setMonthlyPosts(data || 0);
                };
                fetchUsage();
              }}
            />

            <ProPostsSection 
              onEditPost={handleEditPost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          </div>
        ) : (
          // Starter users
          <div className="space-y-6">
            <UsageIndicators 
              monthlyPosts={currentMonthPosts}
              previousPeriodPosts={0}
              daysRemaining={30}
              maxPosts={postLimit}
              isProPlan={false}
              subscriptionStartDate={subscriptionStartDate}
              canCreatePosts={currentMonthPosts < postLimit}
            />

            <NavigationTabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              isProUser={false}
              showContentGenerator={true}
            />

            <div className="space-y-6">
              {activeTab === 'content-generator' && (
                <ContentGenerationForm 
                  currentMonthPosts={currentMonthPosts}
                  isProUser={false}
                  isStarterUser={true}
                  isFreeUser={false}
                  onPostCreated={handlePostCreated}
                />
              )}
              
              {activeTab === 'posts' && (
                <PostsDisplay 
                  posts={posts}
                  onEditPost={handleEditPost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContentPage;