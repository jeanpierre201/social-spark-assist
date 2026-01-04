import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Home, ArrowLeft, List, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ContentCreationForm from '@/components/starter/ContentCreationForm';
import PostsList from '@/components/starter/PostsList';
import PostEditDialog from '@/components/starter/PostEditDialog';
import UpgradePrompt from '@/components/starter/UpgradePrompt';
import CalendarView from '@/components/starter/CalendarView';
import ProfileAvatar from '@/components/ProfileAvatar';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
}

interface PostData {
  id?: string;
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
  generated_caption?: string;
  generated_hashtags?: string[];
  media_url?: string;
  created_at?: string;
}

type ViewMode = 'list' | 'calendar';
type ActiveTab = 'create' | 'posts';

const ContentGeneratorStarter = () => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [postsRefreshTrigger, setPostsRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('create');
  
  const {
    monthlyPosts,
    setMonthlyPosts,
    previousPeriodPosts,
    isLoading,
    canCreatePosts,
    daysRemaining,
    subscriptionStartDate
  } = useStarterSubscriptionStatus();

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
            isGenerated: false // Default to false for existing posts
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
  }, [user, toast]);

  // Handle navigation from dashboard with scroll and view mode
  useEffect(() => {
    const state = location.state as { scrollToPosts?: boolean; viewMode?: ViewMode };
    if (state?.scrollToPosts) {
      // Set view mode if specified
      if (state.viewMode) {
        setViewMode(state.viewMode);
      }
      // Switch to posts tab when navigating to see posts
      setActiveTab('posts');
      
      // Clear the state to prevent repeated action
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setShowEditDialog(true);
  };

  const handlePostUpdated = () => {
    setPostsRefreshTrigger(prev => prev + 1);
  };

  // Handle post creation - immediately switch to posts tab
  const handlePostCreated = () => {
    setPostsRefreshTrigger(prev => prev + 1);
    // Immediately switch to posts tab after creation
    setActiveTab('posts');
    toast({
      title: "Post created!",
      description: "Switched to Your Posts to view your new content",
    });
  };

  // Wait for all loading states to complete
  if (isLoading || isLoadingPosts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show upgrade prompt only if user is not subscribed at all
  // Subscribed users with expired creation period should still see their posts
  console.log('Starter page access check:', { subscribed, canCreatePosts, isLoading, isLoadingPosts });
  if (!subscribed) {
    return <UpgradePrompt subscribed={subscribed} canCreatePosts={canCreatePosts} />;
  }
  
  // Track if creation period is expired (for UI adjustments)
  const isCreationExpired = !canCreatePosts;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile */}
        <div className="mb-6 md:mb-8 md:hidden">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Content Generator</h1>
            <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-border" />
              <ProfileAvatar />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {isCreationExpired 
              ? "Your creation period has ended. You can still view and download your content."
              : "Generate up to 10 posts per month with AI assistance"
            }
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Header - Desktop */}
        <div className="mb-8 hidden md:flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Content Generator</h1>
            <p className="text-muted-foreground">
              {isCreationExpired 
                ? "Your creation period has ended. You can still view and download your content."
                : "Generate up to 10 posts per month with AI assistance"
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <div className="h-8 w-px bg-border mx-1" />
            <ProfileAvatar />
          </div>
        </div>

        {/* Expired Banner */}
        {isCreationExpired && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">Creation period expired</p>
                <p className="text-sm text-amber-600">Extend your period to create new content, or view and download your existing posts below.</p>
              </div>
            </div>
            <Button 
              onClick={async () => {
                try {
                  const { error } = await supabase.functions.invoke('extend-creation-period', {
                    headers: {
                      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    },
                  });
                  if (error) throw error;
                  toast({ title: "Success!", description: "Your creation period has been extended for another 30 days" });
                  window.location.reload();
                } catch (error) {
                  toast({ title: "Error", description: "Failed to extend creation period", variant: "destructive" });
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Extend Period
            </Button>
          </div>
        )}

        <UsageIndicators 
          monthlyPosts={monthlyPosts} 
          previousPeriodPosts={previousPeriodPosts}
          daysRemaining={daysRemaining} 
          maxPosts={10}
          isProPlan={false}
          subscriptionStartDate={subscriptionStartDate}
          canCreatePosts={canCreatePosts}
        />

        {/* Tab Navigation */}
        <div className="mb-6">
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
                {posts.length > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {posts.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && !isCreationExpired ? (
          <div className="max-w-2xl">
            <ContentCreationForm
              monthlyPosts={monthlyPosts}
              setMonthlyPosts={setMonthlyPosts}
              canCreatePosts={canCreatePosts}
              setPosts={setPosts}
              onPostCreated={handlePostCreated}
            />
          </div>
        ) : (
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
              <PostsList 
                onEditPost={handleEditPost} 
                refreshTrigger={postsRefreshTrigger}
                subscriptionStartDate={subscriptionStartDate}
                canCreatePosts={canCreatePosts}
              />
            ) : (
              <CalendarView posts={posts} setViewMode={setViewMode} setPosts={setPosts} />
            )}
          </div>
        )}
        
        <PostEditDialog
          post={selectedPost}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onPostUpdated={handlePostUpdated}
        />
      </div>
    </div>
  );
};

export default ContentGeneratorStarter;
