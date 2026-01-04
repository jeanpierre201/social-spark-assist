import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import NavigationTabs from '@/components/content/NavigationTabs';
import { usePostsManager } from '@/hooks/usePostsManager';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ContentGenerationForm from '@/components/content/ContentGenerationForm';
import PostsDisplay from '@/components/content/PostsDisplay';
import ProContentCreationForm from '@/components/dashboard/ProContentCreationForm';
import ProPostsSection from '@/components/dashboard/ProPostsSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Plus, List, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ActiveTab = 'create' | 'posts' | 'content-generator';

const DashboardContentPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { accounts, metrics } = useSocialAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('content-generator');
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

  // Use Pro subscription status hook for proper period validation
  const {
    monthlyPosts,
    setMonthlyPosts,
    previousPeriodPosts,
    isLoading: proStatusLoading,
    subscriptionStartDate,
    canCreatePosts,
    daysRemaining
  } = useProSubscriptionStatus();

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
    // Switch to posts tab after creation
    setActiveTab('posts');
    toast({
      title: "Post created!",
      description: "Switched to Your Posts to view your new content",
    });
  };

  // Track if creation period is expired for Pro users
  const isCreationExpired = isProUser ? !canCreatePosts : false;

  if (loading || (isProUser && proStatusLoading)) {
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
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Content Creation" />

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
              setActiveTab={(tab: string) => setActiveTab(tab as ActiveTab)} 
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
              
              <PostsDisplay 
                posts={posts}
                onEditPost={handleEditPost}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
              />
            </div>
          </div>
        ) : isProUser ? (
          // Pro users with tab separation
          <div className="space-y-6">
            {/* Expired Banner for Pro */}
            {isCreationExpired && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Creation period expired</p>
                    <p className="text-sm text-amber-600">You can still view your posts but cannot create new content or publish.</p>
                  </div>
                </div>
              </div>
            )}

            <UsageIndicators 
              monthlyPosts={monthlyPosts}
              previousPeriodPosts={previousPeriodPosts}
              daysRemaining={daysRemaining}
              maxPosts={100}
              isProPlan={true}
              subscriptionStartDate={subscriptionStartDate}
              canCreatePosts={canCreatePosts}
            />

            {/* Tab Navigation for Pro */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {!isCreationExpired && (
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === 'create'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Create Content
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <List className="h-4 w-4" />
                  Your Posts
                </button>
              </nav>
            </div>

            {/* Tab Content for Pro */}
            {activeTab === 'create' && !isCreationExpired ? (
              <ProContentCreationForm 
                monthlyPosts={monthlyPosts}
                setMonthlyPosts={setMonthlyPosts}
                canCreatePosts={canCreatePosts}
                setPosts={() => {}}
                onPostCreated={() => {
                  setActiveTab('posts');
                  toast({
                    title: "Post created!",
                    description: "Switched to Your Posts to view your new content",
                  });
                }}
              />
            ) : (
              <ProPostsSection 
                onEditPost={handleEditPost}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                canCreatePosts={canCreatePosts}
              />
            )}
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
              setActiveTab={(tab: string) => setActiveTab(tab as ActiveTab)} 
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