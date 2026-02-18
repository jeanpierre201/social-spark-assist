import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Home, ArrowLeft, Clock, List, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import ContentCreationForm from '@/components/starter/ContentCreationForm';
import UpgradePrompt from '@/components/starter/UpgradePrompt';
import ProfileAvatar from '@/components/ProfileAvatar';
import GeneratedPostPreview from '@/components/starter/GeneratedPostPreview';

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

const ContentGeneratorStarterPage2 = () => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [lastCreatedPost, setLastCreatedPost] = useState<PostData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    monthlyPosts,
    setMonthlyPosts,
    previousPeriodPosts,
    isLoading,
    canCreatePosts,
    daysRemaining,
    subscriptionStartDate
  } = useStarterSubscriptionStatus();

  const handleGoHome = () => {
    navigate('/');
  };

  // Handle post creation - show preview
  const handlePostCreated = (newPost?: PostData) => {
    if (newPost) {
      setLastCreatedPost(newPost);
      setShowPreview(true);
    }
    toast({
      title: "Post created!",
      description: "Your content has been generated successfully",
    });
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setLastCreatedPost(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show upgrade prompt only if user is not subscribed at all
  if (!subscribed) {
    return <UpgradePrompt subscribed={subscribed} canCreatePosts={canCreatePosts} />;
  }
  
  const isCreationExpired = !canCreatePosts;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header - Mobile */}
        <div className="mb-6 md:mb-8 md:hidden">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Create Content</h1>
            <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-border" />
              <ProfileAvatar />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {isCreationExpired 
              ? "Your creation period has ended."
              : "Generate up to 10 posts per month with AI assistance"
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
            <Button variant="outline" size="sm" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Link to="/dashboard/posts-starter">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                View Posts
              </Button>
            </Link>
          </div>
        </div>

        {/* Header - Desktop */}
        <div className="mb-8 hidden md:flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Content</h1>
            <p className="text-muted-foreground">
              {isCreationExpired 
                ? "Your creation period has ended."
                : "Generate up to 10 posts per month with AI assistance"
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/dashboard/posts-starter">
              <Button variant="outline" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                View Posts
              </Button>
            </Link>
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
                <p className="text-sm text-amber-600">Extend your period to create new content.</p>
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


        {/* Content Creation Form */}
        {!isCreationExpired ? (
          <div className="mt-6">
            <ContentCreationForm
              monthlyPosts={monthlyPosts}
              setMonthlyPosts={setMonthlyPosts}
              canCreatePosts={canCreatePosts}
              setPosts={setPosts}
              onPostCreated={handlePostCreated}
            />
          </div>
        ) : (
          <div className="mt-6 text-center p-8 bg-white rounded-lg border">
            <p className="text-muted-foreground mb-4">Your creation period has expired. View your existing posts or extend your period.</p>
            <Link to="/dashboard/posts-starter">
              <Button className="flex items-center gap-2 mx-auto">
                <List className="h-4 w-4" />
                View Your Posts
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Post Created Preview */}
        {showPreview && lastCreatedPost && (
          <GeneratedPostPreview
            post={lastCreatedPost}
            onClose={handleClosePreview}
            onViewAllPosts={() => navigate('/dashboard/posts-starter')}
          />
        )}
      </div>
    </div>
  );
};

export default ContentGeneratorStarterPage2;
