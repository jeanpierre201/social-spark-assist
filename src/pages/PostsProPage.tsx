import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { Button } from '@/components/ui/button';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
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
        <DashboardHeader isProUser={isProUser} isStarterUser={false} title="Manage Posts" />

        <ProDashboardNav />

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
