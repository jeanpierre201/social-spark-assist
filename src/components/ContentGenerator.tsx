
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
  Copy, 
  Download,
  Home,
  ArrowLeft,
  Crown,
  Lock,
  Plus,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ContentVariations from './ContentVariations';
import UpgradePrompt from './starter/UpgradePrompt';

interface GeneratedPost {
  caption: string;
  hashtags: string[];
  variations?: Array<{
    caption: string;
    hashtags: string[];
    variation: string;
  }>;
}

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check user subscription status
  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (subscriptionTier === 'Pro' || subscriptionTier === 'Starter');

  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Redirect Starter users to their dedicated page
  useEffect(() => {
    if (!subscriptionLoading && isStarterUser) {
      navigate('/content-generator-starter');
    }
  }, [isStarterUser, subscriptionLoading, navigate]);

  const handleGenerate = async (generateVariations = false) => {
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
      const requestBody: any = {
        industry: industry,
        goal: goal,
        nicheInfo: nicheInfo || undefined
      };

      // Add variations for Pro users
      if (isProUser && generateVariations) {
        requestBody.generateVariations = true;
        requestBody.variationCount = 3;
      }

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: requestBody
      });

      if (error) {
        throw error;
      }

      let generatedContent: GeneratedPost;

      if (data.variations) {
        // Pro user with variations
        generatedContent = {
          caption: data.variations[0].caption,
          hashtags: data.variations[0].hashtags,
          variations: data.variations
        };
      } else {
        // Single content generation
        generatedContent = {
          caption: data.caption,
          hashtags: data.hashtags
        };
      }

      setGeneratedPost(generatedContent);

      toast({
        title: "Content Generated",
        description: generateVariations ? "Content with variations generated successfully" : "Your social media content has been generated",
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
      document.body.appendChild(element);
      element.click();
    }
  };

  const handleSelectVariation = (variation: any) => {
    setGeneratedPost({
      ...generatedPost!,
      caption: variation.caption,
      hashtags: variation.hashtags
    });
  };

  const handleDownloadVariation = (variation: any) => {
    const element = document.createElement("a");
    const contentText = `${variation.caption}\n\n${variation.hashtags.map((tag: string) => `#${tag}`).join(' ')}`;
    const file = new Blob([contentText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${variation.variation}_content.txt`;
    document.body.appendChild(element);
    element.click();
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription status...</p>
        </div>
      </div>
    );
  }

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
              {!hasAnyPlan && (
                <Badge className="ml-2 bg-gray-100 text-gray-800">
                  Free Trial
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>

        {/* Show upgrade prompt for non-subscribers */}
        {!hasAnyPlan && (
          <div className="mb-8">
            <UpgradePrompt subscribed={subscribed} canCreatePosts={true} />
          </div>
        )}

        {/* Content Generation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className={`h-6 w-6 ${isProUser ? 'text-purple-500' : 'text-blue-500'}`} />
              <span>Generate Content</span>
            </CardTitle>
            <CardDescription>
              {isProUser 
                ? "Generate multiple content variations with advanced AI features"
                : hasAnyPlan 
                ? "Create engaging social media content"
                : "Try our AI content generation (limited features)"
              }
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
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </div>

            {/* Pro feature: Niche Info */}
            {hasAnyPlan && (
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
            )}

            {/* Pro feature: Scheduling */}
            {isProUser && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Post (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="scheduledDate" className="text-sm">Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledTime" className="text-sm">Time</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={() => handleGenerate(false)} 
                disabled={loading || !industry || !goal}
                className={`w-full ${isProUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
              >
                {loading ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {/* Pro feature: Generate with variations */}
              {isProUser && (
                <Button
                  onClick={() => handleGenerate(true)}
                  disabled={loading || !industry || !goal}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate with Variations (Pro)
                </Button>
              )}
            </div>

            {/* Pro Feature: Content Variations */}
            {generatedPost && isProUser && generatedPost.variations && (
              <div className="pt-4 border-t">
                <ContentVariations 
                  variations={generatedPost.variations}
                  onSelectVariation={handleSelectVariation}
                  onDownloadVariation={handleDownloadVariation}
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
                className="resize-none min-h-[120px]"
              />
              <div className="flex flex-wrap gap-1">
                {generatedPost.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-500 text-sm">#{tag}</span>
                ))}
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
