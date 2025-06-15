
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ContentCreationForm from '@/components/starter/ContentCreationForm';
import GeneratedPostsPreview from '@/components/starter/GeneratedPostsPreview';
import UpgradePrompt from '@/components/starter/UpgradePrompt';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
}

interface PostData {
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
}

const ContentGeneratorStarter = () => {
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  
  const {
    monthlyPosts,
    setMonthlyPosts,
    isLoading,
    canCreatePosts,
    daysRemaining
  } = useStarterSubscriptionStatus();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Starter Content Generator</h1>
            <p className="text-muted-foreground">Generate up to 10 posts per month with AI assistance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>

        <UsageIndicators monthlyPosts={monthlyPosts} daysRemaining={daysRemaining} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContentCreationForm 
            monthlyPosts={monthlyPosts}
            setMonthlyPosts={setMonthlyPosts}
            canCreatePosts={canCreatePosts}
            setPosts={setPosts}
          />
          <GeneratedPostsPreview posts={posts} />
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorStarter;
