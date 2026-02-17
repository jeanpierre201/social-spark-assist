import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Home, ArrowLeft, List, Calendar as CalendarIcon, Clock, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PostsList from '@/components/starter/PostsList';
import PostEditDialog from '@/components/starter/PostEditDialog';
import UpgradePrompt from '@/components/starter/UpgradePrompt';
import CalendarView from '@/components/starter/CalendarView';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Error Boundary for PostEditDialog
interface ErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PostEditErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PostEditDialog] Render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Unable to Edit Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading this post. This may be due to missing data or a connection issue.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onClose();
                }}
              >
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}


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

const PostsStarterPage = () => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [postsRefreshTrigger, setPostsRefreshTrigger] = useState(0);
  
  const {
    isLoading,
    canCreatePosts,
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
            isGenerated: false
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

  const handleGoHome = () => {
    navigate('/');
  };

  const handleEditPost = (post: any) => {
    // Normalize post data to prevent white page errors
    const normalizedPost = {
      ...post,
      social_platforms: Array.isArray(post.social_platforms) ? post.social_platforms : [],
      generated_hashtags: Array.isArray(post.generated_hashtags) ? post.generated_hashtags : [],
      generated_caption: post.generated_caption || '',
      industry: post.industry || '',
      goal: post.goal || '',
      niche_info: post.niche_info || '',
    };
    setSelectedPost(normalizedPost);
    setShowEditDialog(true);
  };

  const handlePostUpdated = async () => {
    setPostsRefreshTrigger(prev => prev + 1);
    
    // Re-fetch the selected post to update the edit dialog with fresh data
    if (selectedPost?.id) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', selectedPost.id)
          .single();
        
        if (!error && data) {
          const normalizedPost = {
            ...data,
            social_platforms: Array.isArray(data.social_platforms) ? data.social_platforms : [],
            generated_hashtags: Array.isArray(data.generated_hashtags) ? data.generated_hashtags : [],
            generated_caption: data.generated_caption || '',
            industry: data.industry || '',
            goal: data.goal || '',
            niche_info: data.niche_info || '',
          };
          setSelectedPost(normalizedPost);
        }
      } catch (err) {
        console.error('Error re-fetching post:', err);
      }
    }
  };

  if (isLoading || isLoadingPosts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscribed) {
    return <UpgradePrompt subscribed={subscribed} canCreatePosts={canCreatePosts} />;
  }
  
  const isCreationExpired = !canCreatePosts;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile */}
        <div className="mb-6 md:mb-8 md:hidden">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Your Posts</h1>
            <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-border" />
              <ProfileAvatar />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {isCreationExpired 
              ? "Your creation period has ended. You can still view and download your content."
              : "View and manage all your generated posts"
            }
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            {!isCreationExpired && (
              <Link to="/dashboard/content-generator-starter">
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Header - Desktop */}
        <div className="mb-8 hidden md:flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Posts</h1>
            <p className="text-muted-foreground">
              {isCreationExpired 
                ? "Your creation period has ended. You can still view and download your content."
                : "View and manage all your generated posts"
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!isCreationExpired && (
              <Link to="/dashboard/content-generator-starter">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Post
                </Button>
              </Link>
            )}
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
                <p className="text-sm text-amber-600">You can view and download your content, but publishing and editing are disabled.</p>
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

        {/* Posts Section */}
        <div className="space-y-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Posts ({posts.length})</h2>
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
          {viewMode === 'list' ? (
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
        
        <PostEditErrorBoundary onClose={() => setShowEditDialog(false)}>
          <PostEditDialog
            post={selectedPost}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onPostUpdated={handlePostUpdated}
          />
        </PostEditErrorBoundary>
      </div>
    </div>
  );
};

export default PostsStarterPage;
