import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Home, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import ProContentCreationForm from '@/components/dashboard/ProContentCreationForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';
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

const ContentGeneratorProPage2 = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [lastCreatedPost, setLastCreatedPost] = useState<PostData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    monthlyPosts,
    setMonthlyPosts,
    previousPeriodPosts,
    isLoading: proStatusLoading,
    canCreatePosts,
    daysRemaining,
    subscriptionStartDate
  } = useProSubscriptionStatus();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isCreationExpired = !canCreatePosts;

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

  if (loading || proStatusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show upgrade prompt if not Pro user
  if (!isProUser) {
    return <UpgradePrompt />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={false} title="Content Generation" />

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
                  <p className="text-sm text-amber-600">You can still view your posts but cannot create new content.</p>
                </div>
              </div>
            </div>
          )}

          {/* Content Creation Form */}
          {!isCreationExpired ? (
            <ProContentCreationForm 
              monthlyPosts={monthlyPosts}
              setMonthlyPosts={setMonthlyPosts}
              canCreatePosts={canCreatePosts}
              setPosts={setPosts}
              onPostCreated={handlePostCreated}
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-lg border">
              <p className="text-muted-foreground mb-4">Your creation period has expired. View your existing posts.</p>
              <Button 
                onClick={() => navigate('/dashboard/posts-pro')}
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
              onViewAllPosts={() => navigate('/dashboard/posts-pro')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorProPage2;
