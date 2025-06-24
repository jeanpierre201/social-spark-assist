
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Wand2, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  Copy, 
  Download,
  Home,
  ArrowLeft,
  Crown,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ContentVariations from './ContentVariations';
import UpgradePrompt from './starter/UpgradePrompt';

interface GeneratedPost {
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  variations?: Array<{
    caption: string;
    hashtags: string[];
    style: string;
  }>;
}

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user has Pro plan
  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  useEffect(() => {
    // Load any existing scheduled content or settings from local storage or database
  }, []);

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIndustry(e.target.value);
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoal(e.target.value);
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate content",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!industry || !goal) {
      toast({
        title: "Missing Information",
        description: "Please select an industry and enter a goal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call Supabase function to generate content
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          industry: industry,
          goal: goal,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Parse the generated caption and hashtags from the response
      const generatedCaption = data.generated_caption;
      const generatedHashtags = data.generated_hashtags;

      // Update the state with the generated content
      setGeneratedPost({
        caption: generatedCaption,
        hashtags: generatedHashtags
      });

      toast({
        title: "Content Generated",
        description: "Your social media content has been generated",
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost.caption);
      toast({
        title: "Caption Copied",
        description: "The generated caption has been copied to your clipboard",
      });
    }
  };

  const handleDownloadCaption = () => {
    if (generatedPost) {
      const element = document.createElement("a");
      const file = new Blob([generatedPost.caption], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "generated_caption.txt";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Content Generator</h1>
            <p className="text-muted-foreground">
              Create engaging social media content with AI
              {isProUser && (
                <Badge className="ml-2 bg-purple-100 text-purple-800">
                  <Crown className="h-3 w-3 mr-1 text-purple-600" />
                  Pro Features Active
                </Badge>
              )}
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

        {/* Content Generation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className={`h-6 w-6 ${isProUser ? 'text-purple-500' : 'text-blue-500'}`} />
              <span>Generate Content</span>
            </CardTitle>
            <CardDescription>
              Tell us about your content goals and we'll create engaging posts for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select onValueChange={setIndustry}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Food & Beverage">Food &amp; Beverage</SelectItem>
                    <SelectItem value="Travel & Tourism">Travel &amp; Tourism</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                    <SelectItem value="Arts & Entertainment">Arts &amp; Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal">Goal</Label>
                <Input 
                  type="text" 
                  id="goal" 
                  placeholder="e.g., Increase brand awareness" 
                  value={goal}
                  onChange={handleGoalChange}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !industry || !goal}
                className={`flex-1 ${isProUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
              >
                {loading ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className={`h-4 w-4 mr-2 ${isProUser ? 'text-white' : ''}`} />
                    Generate Content
                  </>
                )}
              </Button>
            </div>

            {/* Pro Feature: Content Variations */}
            {generatedPost && isProUser && (
              <div className="pt-4 border-t">
                <ContentVariations 
                  post={generatedPost}
                  industry={industry}
                  goal={goal}
                  onVariationSelect={(variation) => {
                    setGeneratedPost({
                      ...generatedPost,
                      caption: variation.caption,
                      hashtags: variation.hashtags
                    });
                  }}
                />
              </div>
            )}

            {/* Locked variations for non-Pro users */}
            {generatedPost && !isProUser && (
              <div className="pt-4 border-t">
                <Card className="relative overflow-hidden border-purple-200">
                  <div className="absolute inset-0 bg-gray-50/80 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-purple-600 font-medium">Pro Feature</p>
                      <p className="text-xs text-purple-500">Generate multiple content variations</p>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-700">Content Variations</CardTitle>
                    <CardDescription>Generate 3-5 different versions of your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 opacity-30">
                      <div className="p-3 border rounded bg-gray-50">
                        <p className="text-sm font-medium">Professional Style</p>
                        <p className="text-xs text-muted-foreground">Formal, business-focused tone</p>
                      </div>
                      <div className="p-3 border rounded bg-gray-50">
                        <p className="text-sm font-medium">Casual & Fun</p>
                        <p className="text-xs text-muted-foreground">Relaxed, engaging tone</p>
                      </div>
                      <div className="p-3 border rounded bg-gray-50">
                        <p className="text-sm font-medium">Story-driven</p>
                        <p className="text-xs text-muted-foreground">Narrative approach</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Content Display */}
        {generatedPost && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className={`h-5 w-5 ${isProUser ? 'text-purple-500' : 'text-green-500'}`} />
                <span>Generated Content</span>
                {isProUser && <Badge className="bg-purple-100 text-purple-800">Pro</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea 
                value={generatedPost.caption}
                readOnly
                className="resize-none"
              />
              <div className="text-blue-500">
                {generatedPost.hashtags.map(tag => `#${tag} `)}
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" className="flex-1" onClick={handleCopyCaption}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Caption
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadCaption}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
