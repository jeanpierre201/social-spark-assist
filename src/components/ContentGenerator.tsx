import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Download, AlertCircle, Loader2, Home, ArrowLeft, Plus, Calendar as CalendarIcon, Wand2, Crown, Upload, Image, Video, Clock, Edit, Save, X, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
  imagePrompt?: string;
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
  mediaFile?: File;
  mediaUrl?: string;
}

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [monthlyPosts, setMonthlyPosts] = useState(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [editForm, setEditForm] = useState({
    caption: '',
    hashtags: '',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '',
    mediaFile: null as File | null
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Determine plan limits and features
  const isStarterOrHigher = subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise');
  const monthlyLimit = isStarterOrHigher ? 10 : 1;
  const planName = isStarterOrHigher ? 'Starter Plan' : 'Free Plan';

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
            scheduledDate: post.scheduled_date,
            scheduledTime: post.scheduled_time,
            generatedContent: {
              caption: post.generated_caption,
              hashtags: post.generated_hashtags
            },
            created_at: post.created_at,
            mediaUrl: post.media_url
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

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image (JPEG, PNG, GIF) or video (MP4, MOV, AVI)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setMediaFile(file);
    }
  };

  const handleEditMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image (JPEG, PNG, GIF) or video (MP4, MOV, AVI)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setEditForm(prev => ({ ...prev, mediaFile: file }));
    }
  };

  const handleEditPost = (post: PostData) => {
    setEditingPost(post);
    setEditForm({
      caption: post.generatedContent?.caption || '',
      hashtags: post.generatedContent?.hashtags.join(' ') || '',
      scheduledDate: post.scheduledDate ? new Date(post.scheduledDate) : undefined,
      scheduledTime: post.scheduledTime || '',
      mediaFile: null
    });
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !user) return;

    setIsUpdating(true);

    try {
      // Upload new media file if present
      let mediaUrl = editingPost.mediaUrl;
      if (editForm.mediaFile) {
        const fileName = `${user.id}/${Date.now()}-${editForm.mediaFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, editForm.mediaFile);

        if (uploadError) {
          console.error('Media upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);
          mediaUrl = urlData.publicUrl;
        }
      }

      const hashtags = editForm.hashtags.split(' ').filter(tag => tag.trim().length > 0);

      // Convert scheduled time to UTC for storage
      let scheduledDateUTC = null;
      let scheduledTimeUTC = null;
      
      if (editForm.scheduledDate && editForm.scheduledTime) {
        const localDateTime = new Date(`${format(editForm.scheduledDate, 'yyyy-MM-dd')}T${editForm.scheduledTime}`);
        const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
        scheduledDateUTC = format(utcDateTime, 'yyyy-MM-dd');
        scheduledTimeUTC = format(utcDateTime, 'HH:mm:ss');
      } else if (editForm.scheduledDate) {
        scheduledDateUTC = format(editForm.scheduledDate, 'yyyy-MM-dd');
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({
          generated_caption: editForm.caption,
          generated_hashtags: hashtags,
          scheduled_date: scheduledDateUTC,
          scheduled_time: scheduledTimeUTC,
          media_url: mediaUrl
        })
        .eq('id', editingPost.id);

      if (updateError) throw updateError;

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === editingPost.id 
          ? {
              ...post,
              generatedContent: {
                caption: editForm.caption,
                hashtags: hashtags
              },
              scheduledDate: scheduledDateUTC || undefined,
              scheduledTime: scheduledTimeUTC || undefined,
              mediaUrl: mediaUrl
            }
          : post
      ));

      setEditingPost(null);
      toast({
        title: "Post Updated!",
        description: "Your post has been successfully updated",
      });

    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const generateImageFromContent = async (caption: string, industry: string): Promise<{ image: string; imagePrompt: string } | null> => {
    try {
      setIsGeneratingImage(true);
      
      // Create a prompt for image generation based on the content
      const imagePrompt = `Professional ${industry} social media post image. ${caption.substring(0, 200)}. High quality, modern, engaging visual for social media. Clean composition, good lighting, professional style.`;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: imagePrompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        }
      });

      if (error) throw error;

      return {
        image: data.image,
        imagePrompt: data.revisedPrompt || imagePrompt
      };
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Image Generation Failed",
        description: "Failed to generate AI image. Content saved without image.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
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

      // Generate AI image if requested
      if (generateWithImages) {
        const imageResult = await generateImageFromContent(newGeneratedContent.caption, sanitizedIndustry);
        if (imageResult) {
          newGeneratedContent.image = imageResult.image;
          newGeneratedContent.imagePrompt = imageResult.imagePrompt;
        }
      }

      // Upload media file if present
      let mediaUrl = null;
      if (mediaFile) {
        const fileName = `${user.id}/${Date.now()}-${mediaFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error('Media upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);
          mediaUrl = urlData.publicUrl;
        }
      }

      // If we have an AI generated image, upload it to storage
      if (newGeneratedContent.image && !mediaUrl) {
        try {
          // Convert base64 to blob
          const response = await fetch(newGeneratedContent.image);
          const blob = await response.blob();
          
          const fileName = `${user.id}/${Date.now()}-ai-generated.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, blob);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('media')
              .getPublicUrl(fileName);
            mediaUrl = urlData.publicUrl;
          }
        } catch (imageUploadError) {
          console.error('Error uploading AI generated image:', imageUploadError);
        }
      }

      // Convert scheduled time to UTC for storage
      let scheduledDateUTC = null;
      let scheduledTimeUTC = null;
      
      if (scheduledDate && scheduledTime) {
        const localDateTime = new Date(`${format(scheduledDate, 'yyyy-MM-dd')}T${scheduledTime}`);
        const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
        scheduledDateUTC = format(utcDateTime, 'yyyy-MM-dd');
        scheduledTimeUTC = format(utcDateTime, 'HH:mm:ss');
      } else if (scheduledDate) {
        scheduledDateUTC = format(scheduledDate, 'yyyy-MM-dd');
      }

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          niche_info: sanitizedNicheInfo || null,
          generated_caption: newGeneratedContent.caption,
          generated_hashtags: newGeneratedContent.hashtags,
          scheduled_date: scheduledDateUTC,
          scheduled_time: scheduledTimeUTC,
          media_url: mediaUrl
        });

      if (dbError) throw dbError;

      if (isStarterOrHigher) {
        const newPost: PostData = {
          industry: sanitizedIndustry,
          goal: sanitizedGoal,
          nicheInfo: sanitizedNicheInfo,
          scheduledDate: scheduledDateUTC || undefined,
          scheduledTime: scheduledTimeUTC || undefined,
          generatedContent: newGeneratedContent,
          created_at: new Date().toISOString(),
          mediaUrl
        };
        setPosts(prev => [newPost, ...prev]);
        setIndustry('');
        setGoal('');
        setNicheInfo('');
        setScheduledDate(undefined);
        setScheduledTime('');
        setMediaFile(null);
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

        // Generate AI image if requested
        if (generateWithImages) {
          const imageResult = await generateImageFromContent(generatedContent.caption, industry.trim());
          if (imageResult) {
            generatedContent.image = imageResult.image;
            generatedContent.imagePrompt = imageResult.imagePrompt;
          }
        }

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

  const renderCalendarView = () => {
    // Create a 30-day grid starting from today
    const startDate = new Date();
    const days = Array.from({ length: 30 }, (_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-7 gap-2 p-4">
        {/* Calendar header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayPosts = posts.filter(post => {
            if (!post.scheduledDate) return false;
            // Convert UTC stored date back to local time for comparison
            const storedDate = new Date(post.scheduledDate);
            return isSameDay(storedDate, day);
          });
          
          return (
            <div 
              key={index} 
              className={cn(
                "min-h-24 p-2 border rounded-lg",
                dayPosts.length > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50"
              )}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayPosts.map((post, postIndex) => (
                  <div 
                    key={postIndex}
                    className="text-xs bg-blue-100 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-blue-200 transition-colors"
                    title={post.generatedContent?.caption || ''}
                    onClick={() => handleEditPost(post)}
                  >
                    {post.scheduledTime && (
                      <span className="font-medium">
                        {/* Convert UTC time back to local time for display */}
                        {post.scheduledDate && post.scheduledTime ? 
                          formatInTimeZone(
                            new Date(`${post.scheduledDate}T${post.scheduledTime}Z`), 
                            userTimezone, 
                            'HH:mm'
                          ) : 
                          post.scheduledTime
                        }
                      </span>
                    )}
                    <div className="truncate">
                      {post.generatedContent?.caption?.substring(0, 20)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderImageGenerationCheckbox = () => (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="generate-images"
        checked={generateWithImages}
        onChange={(e) => setGenerateWithImages(e.target.checked)}
        className="rounded border-gray-300"
      />
      <Label htmlFor="generate-images" className="text-sm">
        Generate AI images with DALL-E 3
      </Label>
      {isGeneratingImage && (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      )}
    </div>
  );

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
                {isStarterOrHigher ? 'Generate single posts or batch create content with scheduling' : 'Generate your monthly post'}
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

              {/* Media Upload */}
              <div>
                <Label htmlFor="media">Upload Image or Video (Optional)</Label>
                <div className="mt-2">
                  <Input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('media')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {mediaFile ? mediaFile.name : 'Choose Image or Video'}
                  </Button>
                  {mediaFile && (
                    <div className="mt-2 flex items-center space-x-2">
                      {mediaFile.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-green-600" />
                      ) : (
                        <Video className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="text-sm text-gray-600">{mediaFile.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMediaFile(null)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduling Section */}
              {isStarterOrHigher && (
                <div className="space-y-3">
                  <Label className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Post (Optional)
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="date" className="text-sm">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label htmlFor="time" className="text-sm">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Updated AI image generation checkbox */}
              {renderImageGenerationCheckbox()}

              <div className="space-y-2">
                <Button
                  onClick={handleGenerateSingle}
                  disabled={isGenerating || isGeneratingImage || monthlyPosts >= monthlyLimit || !industry.trim() || !goal.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating || isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isGeneratingImage ? 'Generating Image...' : 'Generating...'}
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
                    disabled={isGenerating || isGeneratingImage || monthlyPosts >= monthlyLimit || !industry.trim() || !goal.trim()}
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
                  <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
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
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="list" className="flex items-center space-x-2">
                        <List className="h-4 w-4" />
                        <span>List View</span>
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Calendar View</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="list" className="mt-4">
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {posts.map((post, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {post.industry}
                              </Badge>
                              <div className="flex space-x-1">
                                {post.scheduledDate && (
                                  <Badge variant="outline" className="text-xs">
                                    {post.scheduledDate} {post.scheduledTime && (
                                      `at ${
                                        post.scheduledDate && post.scheduledTime ? 
                                          formatInTimeZone(
                                            new Date(`${post.scheduledDate}T${post.scheduledTime}Z`), 
                                            userTimezone, 
                                            'HH:mm'
                                          ) : 
                                          post.scheduledTime
                                      } (${userTimezone})`
                                    )}
                                  </Badge>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditPost(post)}
                                >
                                  <Edit className="h-3 w-3" />
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
                            {(post.mediaUrl || post.generatedContent?.image) && (
                              <div className="mb-2">
                                {(post.mediaUrl || post.generatedContent?.image) && (
                                  <img 
                                    src={post.mediaUrl || post.generatedContent?.image} 
                                    alt="Post media" 
                                    className="w-full h-20 object-cover rounded" 
                                  />
                                )}
                              </div>
                            )}
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
                    </TabsContent>
                    
                    <TabsContent value="calendar" className="mt-4">
                      <div className="max-h-96 overflow-y-auto">
                        {renderCalendarView()}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No posts generated yet. Create your first post!</p>
                  </div>
                )
              ) : (
                generatedContent ? (
                  <div className="space-y-4">
                    {generatedContent.image && (
                      <div>
                        <Label>Generated Image</Label>
                        <div className="mt-1">
                          <img 
                            src={generatedContent.image} 
                            alt="AI Generated" 
                            className="w-full rounded-lg border" 
                          />
                          {generatedContent.imagePrompt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Prompt: {generatedContent.imagePrompt}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

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
        
        {/* Edit Post Dialog */}
        {editingPost && (
          <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>
                  Make changes to your post content and scheduling (times shown in {userTimezone})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-caption">Caption</Label>
                  <Textarea
                    id="edit-caption"
                    value={editForm.caption}
                    onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hashtags">Hashtags</Label>
                  <Input
                    id="edit-hashtags"
                    value={editForm.hashtags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="Enter hashtags separated by spaces"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Scheduled Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editForm.scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.scheduledDate ? format(editForm.scheduledDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editForm.scheduledDate}
                          onSelect={(date) => setEditForm(prev => ({ ...prev, scheduledDate: date }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="edit-time">Scheduled Time ({userTimezone})</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editForm.scheduledTime}
                      onChange={(e) => setEditForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-media">Update Media (Optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="edit-media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleEditMediaUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('edit-media')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {editForm.mediaFile ? editForm.mediaFile.name : 'Choose New Image or Video'}
                    </Button>
                    {editForm.mediaFile && (
                      <div className="mt-2 flex items-center space-x-2">
                        {editForm.mediaFile.type.startsWith('image/') ? (
                          <Image className="h-4 w-4 text-green-600" />
                        ) : (
                          <Video className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="text-sm text-gray-600">{editForm.mediaFile.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditForm(prev => ({ ...prev, mediaFile: null }))}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingPost(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdatePost}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
