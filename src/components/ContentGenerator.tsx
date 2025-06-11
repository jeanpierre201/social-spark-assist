
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Download, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
}

const ContentGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [monthlyPosts, setMonthlyPosts] = useState(0);
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

  const validateInput = (text: string, maxLength: number) => {
    return text.trim().length > 0 && text.length <= maxLength;
  };

  const sanitizeInput = (text: string) => {
    // Basic input sanitization
    return text.trim().replace(/[<>]/g, '');
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
        variant: "destructive",
      });
      return;
    }

    // Check monthly limit
    if (monthlyPosts >= 1) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your free plan limit of 1 post per month. Upgrade to generate more content!",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!validateInput(industry, 100)) {
      toast({
        title: "Invalid Industry",
        description: "Industry must be between 1 and 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (!validateInput(goal, 200)) {
      toast({
        title: "Invalid Goal",
        description: "Goal must be between 1 and 200 characters",
        variant: "destructive",
      });
      return;
    }

    if (nicheInfo && nicheInfo.length > 300) {
      toast({
        title: "Invalid Niche Info",
        description: "Niche information must be less than 300 characters",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Sanitize inputs
      const sanitizedIndustry = sanitizeInput(industry);
      const sanitizedGoal = sanitizeInput(goal);
      const sanitizedNicheInfo = sanitizeInput(nicheInfo);

      // Call edge function to generate content
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          nicheInfo: sanitizedNicheInfo
        }
      });

      if (error) throw error;

      const { caption, hashtags } = data;

      // Save to database
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          niche_info: sanitizedNicheInfo || null,
          generated_caption: caption,
          generated_hashtags: hashtags
        });

      if (dbError) throw dbError;

      setGeneratedContent({ caption, hashtags });
      setMonthlyPosts(prev => prev + 1);

      toast({
        title: "Content Generated!",
        description: "Your AI-powered content is ready to download",
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

  const handleDownload = () => {
    if (!generatedContent) return;

    const content = `Caption:\n${generatedContent.caption}\n\nHashtags:\n${generatedContent.hashtags.join(' ')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Content Generator</h1>
          <p className="text-muted-foreground">Generate engaging social media content with AI</p>
        </div>

        {/* Usage Indicator */}
        <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              Free Plan Usage
            </CardTitle>
            <CardDescription>
              You've used {monthlyPosts} of 1 posts this month
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                Content Details
              </CardTitle>
              <CardDescription>
                Tell us about your content needs
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

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || monthlyPosts >= 1 || !industry.trim() || !goal.trim()}
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
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                Your AI-generated caption and hashtags
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
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
                    onClick={handleDownload}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;
