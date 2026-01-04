import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Clock, Plus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { Button } from '@/components/ui/button';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';
import ProPostsSection from '@/components/dashboard/ProPostsSection';

const PostsProPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const navigate = useNavigate();
  
  const {
    isLoading: proStatusLoading,
    canCreatePosts
  } = useProSubscriptionStatus();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isCreationExpired = !canCreatePosts;

  const handleEditPost = (post: any) => {
    console.log('Edit post:', post);
  };

  const handleUpdatePost = async (post: any, newContent: string) => {
    console.log('Update post:', post, newContent);
  };

  const handleDeletePost = async (id: string) => {
    console.log('Delete post:', id);
  };

  if (loading || proStatusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isProUser) {
    return <UpgradePrompt />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={false} title="Your Posts" />

        {/* Navigation tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => navigate('/dashboard')}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
              >
                Overview
              </button>
              <Link 
                to="/dashboard/content-generator-pro"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
              >
                Content Generator
              </Link>
              <button
                className="border-purple-500 text-purple-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
              >
                Your Posts
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

        <div className="space-y-6">
          {/* Expired Banner */}
          {isCreationExpired && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Creation period expired</p>
                  <p className="text-sm text-amber-600">You can view your posts but cannot publish or edit them.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick link to create */}
          {!isCreationExpired && (
            <div className="flex justify-end">
              <Link to="/dashboard/content-generator-pro">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Post
                </Button>
              </Link>
            </div>
          )}

          {/* Posts Section */}
          <ProPostsSection 
            onEditPost={handleEditPost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            canCreatePosts={canCreatePosts}
          />
        </div>
      </div>
    </div>
  );
};

export default PostsProPage;
