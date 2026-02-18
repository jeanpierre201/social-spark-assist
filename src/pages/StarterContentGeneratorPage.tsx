import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import ContentCreationForm from '@/components/starter/ContentCreationForm';
import UpgradePrompt from '@/components/starter/UpgradePrompt';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StarterDashboardNav from '@/components/dashboard/StarterDashboardNav';
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
  const { subscribed, subscriptionTier } = useSubscription();
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

  const isStarterUser = subscribed && subscriptionTier === 'Starter';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscribed) {
    return <UpgradePrompt subscribed={subscribed} canCreatePosts={canCreatePosts} />;
  }
  
  const isCreationExpired = !canCreatePosts;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={false} isStarterUser={isStarterUser} title="Content Generation" />
        <StarterDashboardNav />

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
            <ContentCreationForm
              monthlyPosts={monthlyPosts}
              setMonthlyPosts={setMonthlyPosts}
              canCreatePosts={canCreatePosts}
              setPosts={setPosts}
              onPostCreated={handlePostCreated}
            />
          ) : (
            <div className="text-center p-8 bg-card rounded-lg border">
              <p className="text-muted-foreground mb-4">Your creation period has expired. View your existing posts or extend your period.</p>
              <Button 
                onClick={() => navigate('/dashboard/posts-starter')}
                className="flex items-center gap-2 mx-auto"
              >
                View Your Posts
              </Button>
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
    </div>
  );
};

export default ContentGeneratorStarterPage2;
