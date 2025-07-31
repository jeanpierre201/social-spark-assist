
import { useState, useEffect } from 'react';
import { usePostsManager } from '@/hooks/usePostsManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, List, Calendar as CalendarIcon } from 'lucide-react';
import UsageIndicators from './starter/UsageIndicators';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';
import SocialMediaSettings from './SocialMediaSettings';
import ContentGeneratorHeader from './content/ContentGeneratorHeader';
import NavigationTabs from './content/NavigationTabs';
import ContentCreationForm from './starter/ContentCreationForm';
import PostsList from './starter/PostsList';
import PostEditDialog from './starter/PostEditDialog';
import CalendarView from './starter/CalendarView';

interface PostData {
  id?: string;
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: {
    caption: string;
    hashtags: string[];
    image?: string;
  };
  generated_caption?: string;
  generated_hashtags?: string[];
  media_url?: string;
  created_at?: string;
}

type ViewMode = 'list' | 'calendar';

const ContentGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [postsRefreshTrigger, setPostsRefreshTrigger] = useState(0);

  const {
    currentMonthPosts,
    isProUser,
    isStarterUser,
    isFreeUser,
  } = usePostsManager();

  // Load existing posts from database
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      
      try {
        setIsLoadingPosts(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform database posts to match our PostData interface
        const transformedPosts = data?.map(post => ({
          id: post.id,
          industry: post.industry,
          goal: post.goal,
          nicheInfo: post.niche_info || '',
          scheduledDate: post.scheduled_date,
          scheduledTime: post.scheduled_time,
          generatedContent: {
            caption: post.generated_caption,
            hashtags: post.generated_hashtags || [],
            image: post.media_url,
          },
          created_at: post.created_at
        })) || [];

        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
        toast({
          title: "Error",
          description: "Failed to load your posts",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [user, toast, postsRefreshTrigger]);

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setShowEditDialog(true);
  };

  const handlePostUpdated = () => {
    setPostsRefreshTrigger(prev => prev + 1);
  };

  const handlePostCreated = () => {
    setPostsRefreshTrigger(prev => prev + 1);
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
              daysRemaining={30}
              maxPosts={isProUser ? 100 : isStarterUser ? 10 : 1}
              isProPlan={isProUser}
              subscriptionStartDate={null}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Content Generation Form */}
              <ContentCreationForm 
                monthlyPosts={currentMonthPosts}
                setMonthlyPosts={() => {}} // Pro users don't need to track monthly posts the same way
                canCreatePosts={true} // Pro users can always create posts
                setPosts={setPosts}
                onPostCreated={handlePostCreated}
              />
              
              <div className="space-y-4" data-posts-section>
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Posts</h2>
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex items-center space-x-1"
                    >
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </Button>
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="flex items-center space-x-1"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span>Calendar</span>
                    </Button>
                  </div>
                </div>

                {/* Posts Display */}
                {isLoadingPosts ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : viewMode === 'list' ? (
                  <PostsList onEditPost={handleEditPost} refreshTrigger={postsRefreshTrigger} />
                ) : (
                  <CalendarView posts={posts} setViewMode={setViewMode} setPosts={setPosts} />
                )}
              </div>
            </div>
            
            <PostEditDialog
              post={selectedPost}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              onPostUpdated={handlePostUpdated}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
