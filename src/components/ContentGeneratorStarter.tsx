import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Home, ArrowLeft, List, Calendar as CalendarIcon } from 'lucide-react';
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
      
      // Scroll to posts section after a brief delay to ensure it's rendered
      setTimeout(() => {
        const postsSection = document.querySelector('[data-posts-section]');
        if (postsSection) {
          postsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
          });
        }
      }, 100);
      
      // Clear the state to prevent repeated scrolling
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have access
  if (!subscribed || !canCreatePosts) {
    return <UpgradePrompt subscribed={subscribed} canCreatePosts={canCreatePosts} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Content Generator</h1>
            <p className="text-muted-foreground">Generate up to 10 posts per month with AI assistance</p>
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

        <UsageIndicators 
          monthlyPosts={monthlyPosts} 
          previousPeriodPosts={previousPeriodPosts}
          daysRemaining={daysRemaining} 
          maxPosts={10}
          isProPlan={false}
          subscriptionStartDate={subscriptionStartDate}
          canCreatePosts={canCreatePosts}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ContentCreationForm 
            monthlyPosts={monthlyPosts}
            setMonthlyPosts={setMonthlyPosts}
            canCreatePosts={canCreatePosts}
            setPosts={setPosts}
            onPostCreated={() => setPostsRefreshTrigger(prev => prev + 1)}
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
        </div>
        
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
