
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ContentGenerator = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const { toast } = useToast();

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
    setEditingPost(post);
    setEditedCaption(post.generated_caption || '');
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    
    updatePostMutation.mutate({
      id: editingPost.id,
      content: editedCaption,
    }, {
      onSuccess: () => {
        toast({ description: 'Post updated successfully!' });
        setEditingPost(null);
        setEditedCaption('');
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to update post', variant: 'destructive' });
      }
    });
  };

  const handleUpdatePost = async (post: any, newContent: string) => {
    updatePostMutation.mutate({ 
      id: post.id, 
      content: newContent,
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
            
            {/* Info banner for free users */}
            {isFreeUser && posts.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-muted-foreground">
                  ✨ Your generated content is stored for 24 hours. Upgrade to Starter or Pro to keep your posts forever and unlock unlimited storage!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            {editingPost?.generated_hashtags && editingPost.generated_hashtags.length > 0 && (
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex flex-wrap gap-1">
                  {editingPost.generated_hashtags.map((hashtag: string, index: number) => (
                    <span key={index} className="text-primary text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePostMutation.isPending}>
              {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentGenerator;
