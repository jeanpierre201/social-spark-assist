
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
import { Sparkles, Download, AlertCircle, Loader2, Home, ArrowLeft, Plus, Calendar, Wand2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  created_at?: string;
}

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [monthlyPosts, setMonthlyPosts] = useState(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine plan limits and features
  const isStarterOrHigher = subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise');
  const monthlyLimit = isStarterOrHigher ? 10 : 1;
  const planName = isStarterOrHigher ? 'Starter Plan' : 'Free Plan';

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Get monthly post count
        const { data: countData, error: countError } = await supabase.rpc('get_monthly_post_count', {
          user_uuid: user.id
        });
        
        if (countError) throw countError;
        setMonthlyPosts(countData || 0);

        // Load existing posts for Starter+ users
        if (isStarterOrHigher) {
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;

          const formattedPosts: PostData[] = (postsData || []).map(post => ({
            id: post.id,
            industry: post.industry,
            goal: post.goal,
            nicheInfo: post.niche_info || '',
            generatedContent: {
              caption: post.generated_caption,
              hashtags: post.generated_hashtags
            },
            created_at: post.created_at
          }));

          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load your data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isStarterOrHigher, toast]);

  const validateInput = (text: string, maxLength: number) => {
    return text.trim().length > 0 && text.length <= maxLength;
  };

  const sanitizeInput = (text: string) => {
    return text.trim().replace(/[<>]/g, '');
  };

  const handleGenerateSingle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
        variant: "destructive",
      });
      return;
    }

    if (monthlyPosts >= monthlyLimit) {
      toast({
        title: "Monthly Limit Reached",
        description: `You've reached your ${planName.toLowerCase()} limit of ${monthlyLimit} post${monthlyLimit > 1 ? 's' : ''} per month.`,
        variant: "destructive",
      });
      return;
    }

    if (!validateInput(industry, 100) || !validateInput(goal, 200)) {
      toast({
        title: "Invalid Input",
        description: "Please fill in the required fields with valid data",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const sanitizedIndustry = sanitizeInput(industry);
      const sanitizedGoal = sanitizeInput(goal);
      const sanitizedNicheInfo = sanitizeInput(nicheInfo);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          nicheInfo: sanitizedNicheInfo
        }
      });

      if (error) throw error;

      const newGeneratedContent: GeneratedContent = {
        caption: data.caption,
        hashtags: data.hashtags
      };

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          niche_info: sanitizedNicheInfo || null,
          generated_caption: newGeneratedContent.caption,
          generated_hashtags: newGeneratedContent.hashtags
        });

      if (dbError) throw dbError;

      if (isStarterOrHigher) {
        const newPost: PostData = {
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          nicheInfo: sanitizedNicheInfo,
          generatedContent: newGeneratedContent,
          created_at: new Date().toISOString()
        };
        setPosts(prev => [newPost, ...prev]);
        setIndustry('');
        setGoal('');
        setNicheInfo('');
      } else {
        setGeneratedContent(newGeneratedContent);
      }

      setMonthlyPosts(prev => prev + 1);

      toast({
        title: "Content Generated!",
        description: isStarterOrHigher ? "Post added to your collection" : "Your content is ready to download",
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

  const handleGenerateAll = async () => {
    if (!isStarterOrHigher) return;

    const remainingPosts = monthlyLimit - monthlyPosts;
    if (remainingPosts <= 0) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've already used all your posts for this month",
        variant: "destructive",
      });
      return;
    }

    if (!validateInput(industry, 100) || !validateInput(goal, 200)) {
      toast({
        title: "Invalid Input",
        description: "Please fill in the required fields",
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
          generatedContent,
          created_at: new Date().toISOString()
        };

        setPosts(prev => [newPost, ...prev]);
        setMonthlyPosts(prev => prev + 1);
      }

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

  const handleDownload = (content?: GeneratedContent) => {
    const contentToDownload = content || generatedContent;
    if (!contentToDownload) return;

    const contentText = `Caption:\n${contentToDownload.caption}\n\nHashtags:\n${contentToDownload.hashtags.join(' ')}`;
    
    const blob = new Blob([contentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-media-content-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Your content has been downloaded successfully",
    });
  };

  const handleGoHome = () => navigate('/');
  const handleGoBack = () => navigate('/dashboard');

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
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Content Generator</h1>
            <p className="text-muted-foreground">
              {isStarterOrHigher ? 'Generate up to 10 posts per month with advanced features' : 'Generate 1 post per month - upgrade for more!'}
            </p>
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
        <Card className={`mb-6 ${isStarterOrHigher ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50' : 'border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {isStarterOrHigher ? (
                <Crown className="h-5 w-5 text-blue-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              )}
              {planName} Usage
            </CardTitle>
            <CardDescription>
              You've used {monthlyPosts} of {monthlyLimit} post{monthlyLimit > 1 ? 's' : ''} this month
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
                {isStarterOrHigher ? 'Generate single posts or batch create content' : 'Generate your monthly post'}
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
                <p className="text-xs text-muted-foreground mt-1">
                  {industry.length}/100 characters
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {goal.length}/200 characters
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {nicheInfo.length}/300 characters
                </p>
              </div>

              {isStarterOrHigher && (
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
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleGenerateSingle}
                  disabled={isGenerating || monthlyPosts >= monthlyLimit || !industry.trim() || !goal.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {isStarterOrHigher ? 'Single Post' : 'Content'}
                    </>
                  )}
                </Button>

                {isStarterOrHigher && (
                  <Button
                    onClick={handleGenerateAll}
                    disabled={isGenerating || monthlyPosts >= monthlyLimit || !industry.trim() || !goal.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Remaining Posts ({monthlyLimit - monthlyPosts} left)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generated Content Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isStarterOrHigher ? (
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                )}
                {isStarterOrHigher ? `Generated Posts (${posts.length})` : 'Generated Content'}
              </CardTitle>
              <CardDescription>
                {isStarterOrHigher ? 'Your generated content ready for scheduling' : 'Your AI-generated caption and hashtags'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStarterOrHigher ? (
                posts.length > 0 ? (
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
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => handleDownload(post.generatedContent)}
                            >
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
                )
              ) : (
                generatedContent ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Caption</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1">
                        <p className="text-sm">{generatedContent.caption}</p>
                      </div>
                    </div>

                    <div>
                      <Label>Hashtags</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mt-1">
                        <p className="text-sm text-blue-600">
                          {generatedContent.hashtags.join(' ')}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDownload()}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Content
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Fill out the form and click "Generate Content" to get started</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;
