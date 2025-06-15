
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Download, AlertCircle, Loader2, Home, ArrowLeft, Plus, Calendar, Clock, Wand2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { user } = useAuth();
  const { subscribed, subscriptionTier, createCheckout } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [monthlyPosts, setMonthlyPosts] = useState(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [canCreatePosts, setCanCreatePosts] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const checkSubscriptionAndLimits = async () => {
      if (!user) return;
      
      try {
        // Check subscription status and get subscription details
        const { data: subscriberData, error: subscriberError } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subscriberError && subscriberError.code !== 'PGRST116') {
          throw subscriberError;
        }

        let subscriptionStart: string | null = null;
        let isWithinCreationWindow = false;
        let remainingDays = 0;

        if (subscriberData && subscriberData.subscribed && 
            (subscriberData.subscription_tier === 'Starter' || subscriberData.subscription_tier === 'Pro')) {
          
          // Get subscription start date from created_at or updated_at when subscription became active
          subscriptionStart = subscriberData.created_at;
          setSubscriptionStartDate(subscriptionStart);

          // Calculate if we're within 30 days of subscription start
          const startDate = new Date(subscriptionStart);
          const currentDate = new Date();
          const daysDifference = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          isWithinCreationWindow = daysDifference <= 30;
          remainingDays = Math.max(0, 30 - daysDifference);
          
          console.log('Subscription check:', {
            startDate: startDate.toISOString(),
            currentDate: currentDate.toISOString(),
            daysDifference,
            isWithinCreationWindow,
            remainingDays
          });
        }

        setCanCreatePosts(isWithinCreationWindow);
        setDaysRemaining(remainingDays);

        // Check monthly post count only if user can create posts
        if (isWithinCreationWindow) {
          const { data, error } = await supabase.rpc('get_monthly_post_count', {
            user_uuid: user.id
          });
          
          if (error) throw error;
          setMonthlyPosts(data || 0);
        }
        
      } catch (error) {
        console.error('Error checking subscription and limits:', error);
        toast({
          title: "Error",
          description: "Failed to check subscription status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionAndLimits();
  }, [user, subscribed, subscriptionTier, toast]);

  const handleGenerateSingle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
        variant: "destructive",
      });
      return;
    }

    if (!canCreatePosts) {
      toast({
        title: "Subscription Required",
        description: "Post creation is only available for 30 days from your subscription start date.",
        variant: "destructive",
      });
      return;
    }

    if (monthlyPosts >= 10) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your Starter plan limit of 10 posts per month.",
        variant: "destructive",
      });
      return;
    }

    if (!industry.trim() || !goal.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least industry and goal fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          industry: industry.trim(),
          goal: goal.trim(),
          nicheInfo: nicheInfo.trim()
        }
      });

      if (error) throw error;

      const generatedContent: GeneratedContent = {
        caption: data.caption,
        hashtags: data.hashtags
      };

      // Generate image if requested
      if (generateWithImages) {
        // TODO: Add image generation call here
        toast({
          title: "Image Generation",
          description: "Image generation will be implemented in the next update",
        });
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: industry.trim(),
          goal: goal.trim(),
          niche_info: nicheInfo.trim() || null,
          generated_caption: generatedContent.caption,
          generated_hashtags: generatedContent.hashtags
        });

      if (dbError) throw dbError;

      const newPost: PostData = {
        industry: industry.trim(),
        goal: goal.trim(),
        nicheInfo: nicheInfo.trim(),
        generatedContent
      };

      setPosts(prev => [...prev, newPost]);
      setMonthlyPosts(prev => prev + 1);

      // Clear form
      setIndustry('');
      setGoal('');
      setNicheInfo('');

      toast({
        title: "Content Generated!",
        description: "Your post has been generated and added to your collection",
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll10 = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
        variant: "destructive",
      });
      return;
    }

    if (!canCreatePosts) {
      toast({
        title: "Subscription Required",
        description: "Post creation is only available for 30 days from your subscription start date.",
        variant: "destructive",
      });
      return;
    }

    const remainingPosts = 10 - monthlyPosts;
    if (remainingPosts <= 0) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've already used all 10 posts for this month",
        variant: "destructive",
      });
      return;
    }

    if (!industry.trim() || !goal.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least industry and goal fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const variations = [
        "Promote brand awareness",
        "Drive engagement",
        "Showcase product features",
        "Share industry insights",
        "Build community",
        "Educate audience",
        "Announce updates",
        "Share behind the scenes",
        "Celebrate milestones",
        "Gather feedback"
      ];

      for (let i = 0; i < Math.min(remainingPosts, 10); i++) {
        const currentGoal = i === 0 ? goal.trim() : `${goal.trim()} - ${variations[i % variations.length]}`;
        
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            industry: industry.trim(),
            goal: currentGoal,
            nicheInfo: nicheInfo.trim()
          }
        });

        if (error) throw error;

        const generatedContent: GeneratedContent = {
          caption: data.caption,
          hashtags: data.hashtags
        };

        // Save to database
        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            industry: industry.trim(),
            goal: currentGoal,
            niche_info: nicheInfo.trim() || null,
            generated_caption: generatedContent.caption,
            generated_hashtags: generatedContent.hashtags
          });

        if (dbError) throw dbError;

        const newPost: PostData = {
          industry: industry.trim(),
          goal: currentGoal,
          nicheInfo: nicheInfo.trim(),
          generatedContent
        };

        setPosts(prev => [...prev, newPost]);
        setMonthlyPosts(prev => prev + 1);
      }

      // Clear form
      setIndustry('');
      setGoal('');
      setNicheInfo('');

      toast({
        title: "Batch Generation Complete!",
        description: `Generated ${Math.min(remainingPosts, 10)} posts successfully`,
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await createCheckout();
  };

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
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Content Generator</h1>
              <p className="text-muted-foreground">Upgrade to access AI-powered content generation</p>
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

          <Card className="text-center p-8">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl mb-2">
                {!subscribed ? "Upgrade Required" : "Creation Period Expired"}
              </CardTitle>
              <CardDescription className="text-lg">
                {!subscribed 
                  ? "Subscribe to the Starter or Pro plan to access AI content generation"
                  : `Post creation is only available for 30 days from subscription start. Your creation period has ended.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!subscribed ? (
                <Button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Upgrade to Starter Plan
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Contact support if you need to extend your content creation period.
                  </p>
                  <Button variant="outline" onClick={handleGoHome}>
                    Return to Home
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

        {/* Usage and Time Limit Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                Monthly Usage
              </CardTitle>
              <CardDescription>
                You've used {monthlyPosts} of 10 posts this month
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                Creation Period
              </CardTitle>
              <CardDescription>
                {daysRemaining} days remaining in your 30-day creation window
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 text-purple-600 mr-2" />
                Create Content
              </CardTitle>
              <CardDescription>
                Generate single posts or batch create content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Fashion, Food..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="goal">Content Goal *</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Promote new product launch, increase brand awareness..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="niche">Niche Information (Optional)</Label>
                <Textarea
                  id="niche"
                  placeholder="Any specific details about your target audience or niche..."
                  value={nicheInfo}
                  onChange={(e) => setNicheInfo(e.target.value)}
                  maxLength={300}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generate-images"
                  checked={generateWithImages}
                  onChange={(e) => setGenerateWithImages(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="generate-images" className="text-sm">
                  Generate AI images (Coming soon)
                </Label>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleGenerateSingle}
                  disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Single Post
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGenerateAll10}
                  disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
                  variant="outline"
                  className="w-full"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Remaining Posts ({10 - monthlyPosts} left)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Posts Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                Generated Posts ({posts.length})
              </CardTitle>
              <CardDescription>
                Your generated content ready for scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {posts.map((post, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.industry}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Calendar className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {post.generatedContent && (
                        <>
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {post.generatedContent.caption}
                          </p>
                          <p className="text-xs text-blue-600">
                            {post.generatedContent.hashtags.slice(0, 3).join(' ')}...
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts generated yet. Create your first post!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorStarter;
