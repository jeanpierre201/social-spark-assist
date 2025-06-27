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
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
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
  Loader2,
  List,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ContentVariations from './ContentVariations';
import UpgradePrompt from './starter/UpgradePrompt';
import UsageIndicators from './starter/UsageIndicators';
import GeneratedPostsPreview from './starter/GeneratedPostsPreview';
import CalendarView from './starter/CalendarView';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
  isGenerated?: boolean;
}

interface GeneratedPost {
  caption: string;
  hashtags: string[];
  variations?: Array<{
    caption: string;
    hashtags: string[];
    variation: string;
  }>;
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

type ViewMode = 'list' | 'calendar';

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Starter subscription status for usage tracking
  const {
    monthlyPosts,
    setMonthlyPosts,
    isLoading: starterLoading,
    canCreatePosts,
    daysRemaining
  } = useStarterSubscriptionStatus();

  // Pro user monthly posts tracking
  const [proMonthlyPosts, setProMonthlyPosts] = useState(0);
  const [isLoadingProPosts, setIsLoadingProPosts] = useState(true);

  // Check user subscription status
  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (subscriptionTier === 'Pro' || subscriptionTier === 'Starter');

  // Form states
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Posts management states (for all users)
  const [posts, setPosts] = useState<PostData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  // Load Pro user monthly posts count
  useEffect(() => {
    const loadProMonthlyPosts = async () => {
      if (!user || !isProUser) {
        setIsLoadingProPosts(false);
        return;
      }
      
      try {
        setIsLoadingProPosts(true);
        const { data, error } = await supabase.rpc('get_monthly_post_count', {
          user_uuid: user.id
        });

        if (error) throw error;
        setProMonthlyPosts(data || 0);
      } catch (error) {
        console.error('Error loading Pro monthly posts:', error);
      } finally {
        setIsLoadingProPosts(false);
      }
    };

    if (isProUser) {
      loadProMonthlyPosts();
    }
  }, [user, isProUser]);

  // Load existing posts for all users
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      
      try {
        setIsLoadingPosts(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedPosts = data?.map(post => ({
          id: post.id,
          industry: post.industry,
          goal: post.goal,
          nicheInfo: post.niche_info || '',
          scheduledDate: post.scheduled_date,
          scheduledTime: post.scheduled_time,
          generatedContent: {
            caption: post.generated_caption,
            hashtags: post.generated_hashtags || [],
            image: post.media_url,
            isGenerated: false
          },
          created_at: post.created_at
        })) || [];

        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
        toast({
          title: "Error",
          description: "Failed to load your posts",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [user, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadedImageUrl(previewUrl);
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

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

    // Check limits for Pro users (100 posts/month)
    if (isProUser) {
      if (proMonthlyPosts >= 100) {
        toast({
          title: "Monthly Limit Reached",
          description: "You've reached your Pro plan limit of 100 posts per month.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check limits for Starter users
    if (isStarterUser) {
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

      if (error) throw error;

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

      // For all users, save to database and update posts
      if (hasAnyPlan) {
        let imageUrl = '';
        if (uploadedImage) {
          const uploadedUrl = await uploadImageToStorage(uploadedImage);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }

        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            industry: industry.trim(),
            goal: goal.trim(),
            niche_info: nicheInfo.trim() || null,
            scheduled_date: scheduledDate || null,
            scheduled_time: scheduledTime || null,
            generated_caption: generatedContent.caption,
            generated_hashtags: generatedContent.hashtags,
            media_url: imageUrl || null
          });

        if (dbError) throw dbError;

        const newPost: PostData = {
          industry: industry.trim(),
          goal: goal.trim(),
          nicheInfo: nicheInfo.trim(),
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          generatedContent: {
            caption: generatedContent.caption,
            hashtags: generatedContent.hashtags,
            image: imageUrl,
            isGenerated: false
          }
        };

        setPosts(prev => [...prev, newPost]);
        
        // Update usage count for Pro and Starter users
        if (isProUser) {
          setProMonthlyPosts(prev => prev + 1);
        } else if (isStarterUser) {
          setMonthlyPosts(prev => prev + 1);
        }

        // Clear form
        setIndustry('');
        setGoal('');
        setNicheInfo('');
        setScheduledDate('');
        setScheduledTime('');
        setUploadedImage(null);
        setUploadedImageUrl('');
      }

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

  const handleGenerateAll10 = async () => {
    if (!user || !isStarterUser) return;

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

    setLoading(true);

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

      let imageUrl = '';
      if (uploadedImage) {
        const uploadedUrl = await uploadImageToStorage(uploadedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

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
          hashtags: data.hashtags,
          image: imageUrl,
          isGenerated: false
        };

        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            industry: industry.trim(),
            goal: currentGoal,
            niche_info: nicheInfo.trim() || null,
            scheduled_date: scheduledDate || null,
            scheduled_time: scheduledTime || null,
            generated_caption: generatedContent.caption,
            generated_hashtags: generatedContent.hashtags,
            media_url: imageUrl || null
          });

        if (dbError) throw dbError;

        const newPost: PostData = {
          industry: industry.trim(),
          goal: currentGoal,
          nicheInfo: nicheInfo.trim(),
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          generatedContent
        };

        setPosts(prev => [...prev, newPost]);
        setMonthlyPosts(prev => prev + 1);
      }

      // Clear form
      setIndustry('');
      setGoal('');
      setNicheInfo('');
      setScheduledDate('');
      setScheduledTime('');
      setUploadedImage(null);
      setUploadedImageUrl('');

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

  if (subscriptionLoading || (isStarterUser && starterLoading) || (isProUser && isLoadingProPosts)) {
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isProUser ? 'Pro Content Generator' : isStarterUser ? 'Starter Content Generator' : 'Content Generator'}
            </h1>
            <p className="text-muted-foreground">
              {isProUser 
                ? 'Unlimited AI-powered content generation with advanced features'
                : isStarterUser 
                ? 'Generate up to 10 posts per month with AI assistance'
                : 'Create engaging social media content with AI'
              }
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

        {/* Usage indicators for Pro users */}
        {isProUser && (
          <UsageIndicators 
            monthlyPosts={proMonthlyPosts} 
            daysRemaining={30} 
            isProPlan={true}
            maxPosts={100}
          />
        )}

        {/* Usage indicators for Starter users */}
        {isStarterUser && (
          <UsageIndicators monthlyPosts={monthlyPosts} daysRemaining={daysRemaining} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {isProUser ? (
                  <Sparkles className="h-6 w-6 text-purple-500" />
                ) : (
                  <Plus className="h-5 w-5 text-purple-600" />
                )}
                <span>{isProUser ? 'Pro Content Generation' : 'Create Content'}</span>
              </CardTitle>
              <CardDescription>
                {isProUser 
                  ? "Generate unlimited content with advanced AI features and variations"
                  : isStarterUser
                  ? "Generate single posts or batch create content with scheduling"
                  : hasAnyPlan 
                  ? "Create engaging social media content"
                  : "Try our AI content generation (limited features)"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select onValueChange={setIndustry} value={industry}>
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
                  <Label htmlFor="goal">Content Goal *</Label>
                  <Input 
                    type="text" 
                    id="goal" 
                    placeholder="e.g., Promote new product launch..." 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Niche Info - available for all subscribers */}
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

              {/* Scheduling - available for all subscribers */}
              {hasAnyPlan && (
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
                      <Label htmlFor="scheduledTime" className="text-sm">Time (UTC)</Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Times are stored in UTC. Your local time will be converted automatically.
                  </p>
                </div>
              )}

              {/* Image Upload - available for all subscribers */}
              {hasAnyPlan && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Media (Optional)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="image-upload" className="text-sm">Upload Image</Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-sm"
                      />
                    </div>
                    
                    {uploadedImageUrl && (
                      <div className="relative">
                        <img 
                          src={uploadedImageUrl} 
                          alt="Uploaded preview" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedImage(null);
                            setUploadedImageUrl('');
                          }}
                          className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="generate-images"
                        checked={generateWithImages}
                        onChange={(e) => setGenerateWithImages(e.target.checked)}
                        className="rounded border-gray-300"
                        disabled={!!uploadedImage}
                      />
                      <Label htmlFor="generate-images" className="text-sm">
                        Generate AI images (Coming soon) {uploadedImage && '- Disabled when image uploaded'}
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={() => handleGenerate(false)} 
                  disabled={loading || !industry || !goal || (isStarterUser && (!canCreatePosts || monthlyPosts >= 10))}
                  className={`w-full ${isProUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : isStarterUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {isProUser ? <Sparkles className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {isProUser ? 'Generate Content' : 'Generate Single Post'}
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

                {/* Starter feature: Generate all remaining posts */}
                {isStarterUser && (
                  <Button
                    onClick={handleGenerateAll10}
                    disabled={loading || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
                    variant="outline"
                    className="w-full"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Remaining Posts ({10 - monthlyPosts} left)
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

          {/* Posts Display */}
          <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Posts</h2>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center space-x-1"
                >
                  <List className="h-4 w-4" />
                  <span>List</span>
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="flex items-center space-x-1"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>Calendar</span>
                </Button>
              </div>
            </div>

            {/* Posts Display */}
            {isLoadingPosts ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : viewMode === 'list' ? (
              <GeneratedPostsPreview posts={posts} setPosts={setPosts} />
            ) : (
              <CalendarView posts={posts} setViewMode={setViewMode} setPosts={setPosts} />
            )}
          </div>
        </div>

        {/* Generated Content Display for non-subscribers (free users) */}
        {!hasAnyPlan && generatedPost && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  <span>Generated Content</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
