
import { useState } from 'react';
import { usePostsManager } from '@/hooks/usePostsManager';
import UsageIndicators from './starter/UsageIndicators';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';
import SocialMediaSettings from './SocialMediaSettings';
import ContentGeneratorHeader from './content/ContentGeneratorHeader';
import NavigationTabs from './content/NavigationTabs';
import ContentGenerationForm from './content/ContentGenerationForm';
import PostsDisplay from './content/PostsDisplay';

const ContentGenerator = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');

  const {
    posts,
    currentMonthPosts,
    isProUser,
    isStarterUser,
    isFreeUser,
    createPostMutation,
    updatePostMutation,
    deletePostMutation
  } = usePostsManager();

  const handleEditPost = (post: any) => {
    setPrompt(post.content);
    setSelectedPlatform(post.platform);
    setScheduledDate(post.scheduled_date ? new Date(post.scheduled_date) : null);
    setScheduledTime(post.scheduled_time || '');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <ContentGeneratorHeader isProUser={isProUser} isStarterUser={isStarterUser} isFreeUser={isFreeUser} />

        <NavigationTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isProUser={isProUser} 
        />

        {/* Tab Content for Pro Users */}
        {isProUser && activeTab === 'analytics' && <ProAnalytics />}
        {isProUser && activeTab === 'team' && <TeamCollaboration />}
        {isProUser && activeTab === 'social' && <SocialMediaSettings />}
        
        {/* Content Generator Tab or Default View */}
        {(!isProUser || activeTab === 'content') && (
          <>
            {/* Usage Indicators */}
            <UsageIndicators 
              monthlyPosts={currentMonthPosts} 
              previousPeriodPosts={0}
              daysRemaining={30}
              maxPosts={isProUser ? 100 : isStarterUser ? 10 : 1}
              isProPlan={isProUser}
              subscriptionStartDate={null}
              canCreatePosts={true}
            />

            {/* Content Generation Form */}
            <div className="mb-6">
              <ContentGenerationForm
                currentMonthPosts={currentMonthPosts}
                isProUser={isProUser}
                isStarterUser={isStarterUser}
                isFreeUser={isFreeUser}
                onPostCreated={handlePostCreated}
              />
            </div>

            {/* Display Generated Posts */}
            <PostsDisplay
              posts={posts}
              onEditPost={handleEditPost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
