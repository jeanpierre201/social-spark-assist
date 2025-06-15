
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Download, AlertCircle, Loader2, Home, ArrowLeft, Plus, Calendar, Clock, Wand2 } from 'lucide-react';
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

  useEffect(() => {
    const checkMonthlyLimit = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_monthly_post_count', {
          user_uuid: user.id
        });
        
        if (error) throw error;
        setMonthlyPosts(data || 0);
      } catch (error) {
        console.error('Error checking monthly limit:', error);
        toast({
          title: "Error",
          description: "Failed to check monthly usage limit",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkMonthlyLimit();
  }, [user, toast]);

  const handleGenerateSingle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
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

        {/* Usage Indicator */}
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              Starter Plan Usage
            </CardTitle>
            <CardDescription>
              You've used {monthlyPosts} of 10 posts this month
            </CardDescription>
          </CardHeader>
        </Card>

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
                  disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim()}
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
                  disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim()}
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
