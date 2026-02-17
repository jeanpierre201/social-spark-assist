
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Wand2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
  isGenerated?: boolean;
}

interface PostData {
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
}

interface ContentCreationFormProps {
  monthlyPosts: number;
  setMonthlyPosts: (value: number | ((prev: number) => number)) => void;
  canCreatePosts: boolean;
  setPosts: (value: PostData[] | ((prev: PostData[]) => PostData[])) => void;
  onPostCreated?: (post?: PostData) => void;
}

const ContentCreationForm = ({ monthlyPosts, setMonthlyPosts, canCreatePosts, setPosts, onPostCreated }: ContentCreationFormProps) => {
  const { user } = useAuth();
  const { accounts } = useSocialAccounts();
  const { toast } = useToast();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<string[]>([]);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [timezoneDisplay, setTimezoneDisplay] = useState<string>('');
  const [generateCaptionWithAI, setGenerateCaptionWithAI] = useState(true);
  const [manualCaption, setManualCaption] = useState('');
  const [manualHashtags, setManualHashtags] = useState('');

  // Fetch user timezone from profile
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();
      
      if (!error && data?.timezone) {
        setUserTimezone(data.timezone);
      } else {
        // Fallback to browser timezone
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(browserTz);
      }
    };
    
    fetchUserTimezone();
  }, [user?.id]);

  // Calculate and display timezone offset
  useEffect(() => {
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const gmtOffset = `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setTimezoneDisplay(`${userTimezone} (${gmtOffset})`);
  }, [userTimezone]);

  const socialPlatforms = [
    { id: 'mastodon', name: 'Mastodon' },
    { id: 'telegram', name: 'Telegram' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'x', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' }
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload images",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload directly to Supabase Storage instead of using blob URLs
      const uploadedUrl = await uploadImageToStorage(file);
      
      if (uploadedUrl) {
        setUploadedImage(file);
        setUploadedImageUrl(uploadedUrl); // Store actual URL, not blob
        
        toast({
          description: "Image uploaded successfully!",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      // Clear the file input to prevent conflicts
      event.target.value = '';
    }
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

  // Helper to parse hashtags from string (validates # prefix)
  const parseHashtags = (hashtagString: string): string[] => {
    return hashtagString
      .split(/\s+/)
      .filter(tag => tag.startsWith('#') && tag.length > 1)
      .map(tag => tag.substring(1)); // Remove the # for storage
  };

  // Validate manual hashtags have # prefix
  const validateManualHashtags = (hashtagString: string): boolean => {
    const tags = hashtagString.trim().split(/\s+/).filter(tag => tag.length > 0);
    return tags.every(tag => tag.startsWith('#'));
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

    if (!canCreatePosts) {
      toast({
        title: "Creation Period Expired",
        description: "Your 30-day creation period has expired. Contact support or upgrade to continue creating posts.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has reached the limit using subscription-based counting
    if (monthlyPosts >= 10) {
      toast({
        title: "Period Limit Reached", 
        description: "You've reached your Starter plan limit of 10 posts for this 30-day period.",
        variant: "destructive",
      });
      return;
    }

    // Validate based on content mode
    if (generateCaptionWithAI) {
      if (!industry.trim() || !goal.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in at least industry and goal fields",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate manual content
      if (!manualCaption.trim()) {
        toast({
          title: "Missing Caption",
          description: "Please write a caption for your post",
          variant: "destructive",
        });
        return;
      }
      if (manualHashtags.trim() && !validateManualHashtags(manualHashtags)) {
        toast({
          title: "Invalid Hashtags",
          description: "Each hashtag must start with #",
          variant: "destructive",
        });
        return;
      }
    }

    setIsGenerating(true);

    try {
      let caption: string;
      let hashtags: string[];

      if (generateCaptionWithAI) {
        // Generate with AI
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            userId: user?.id,
            industry: industry.trim(),
            goal: goal.trim(),
            nicheInfo: nicheInfo.trim(),
            includeEmojis
          }
        });

        if (error) throw error;
        caption = data.caption;
        hashtags = data.hashtags;
      } else {
        // Use manual content
        caption = manualCaption.trim();
        hashtags = parseHashtags(manualHashtags);
      }

      let imageUrl = '';
      let isImageGenerated = false;

      // Handle image upload if provided
      if (uploadedImage) {
        const uploadedUrl = await uploadImageToStorage(uploadedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          isImageGenerated = false;
        }
      }

      // Generate AI image if requested
      if (generateWithImages) {
        try {
          let imagePrompt = '';
          
          // If user provided a custom prompt, use it as the primary prompt
          if (customImagePrompt.trim()) {
            imagePrompt = customImagePrompt.trim();
          } else if (!generateCaptionWithAI && caption) {
            // Use manual caption as the basis for image generation
            imagePrompt = `Create a professional social media image that represents: ${caption}`;
            if (hashtags.length > 0) {
              imagePrompt += `. Related topics: ${hashtags.join(', ')}`;
            }
          } else {
            // Default prompt from AI fields
            imagePrompt = `Create a professional image for ${industry.trim()} industry. Goal: ${goal.trim()}`;
            if (nicheInfo.trim()) {
              imagePrompt += `. Target audience: ${nicheInfo.trim()}`;
            }
          }
          
          if (uploadedImage) {
            imagePrompt += ". Incorporate the uploaded image elements (logo, person, or brand elements) into the new image";
          }

          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image', {
            body: {
              prompt: imagePrompt,
              size: '1024x1024',
              quality: 'standard',
              style: 'vivid'
            }
          });

          if (imageError) {
            console.error('Error generating image:', imageError);
            toast({
              title: "Image generation failed",
              description: "Content was created but image generation failed. You can upload an image manually.",
              variant: "destructive",
            });
          } else if (imageData?.image) {
            // Convert base64 to blob and upload to storage
            const base64Data = imageData.image.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            const timestamp = new Date().getTime();
            const storagePath = `${user.id}/${timestamp}-generated.png`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('ai-images')
              .upload(storagePath, blob, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Error uploading AI image to storage:', uploadError);
              toast({
                title: "Image upload failed",
                description: "Could not save the generated image. Post will be created without image.",
                variant: "destructive",
              });
            } else if (uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from('ai-images')
                .getPublicUrl(uploadData.path);
              
              imageUrl = publicUrlData.publicUrl;
              isImageGenerated = true;
            }
          }
        } catch (imageError) {
          console.error('AI image generation error:', imageError);
          toast({
            title: "Image generation failed", 
            description: "Content was created but image generation failed.",
            variant: "destructive",
          });
        }
      }

      const generatedContent: GeneratedContent = {
        caption: caption,
        hashtags: hashtags,
        image: imageUrl,
        isGenerated: isImageGenerated
      };

      // Convert local time to UTC for storage
      let utcDateStr: string | null = null;
      let utcTimeStr: string | null = null;
      if (scheduledDate && scheduledTime) {
        const localDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
        const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
        // Use toISOString() to correctly extract UTC components
        utcDateStr = utcDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        utcTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC
      }

      // Determine post status based on social media and scheduling
      let postStatus = 'draft';
      if (selectedSocialPlatforms.length > 0) {
        if (scheduledDate && scheduledTime) {
          postStatus = 'scheduled';
        } else {
          postStatus = 'ready'; // Has platforms but no schedule
        }
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: industry.trim(),
          goal: goal.trim(),
          niche_info: nicheInfo.trim() || null,
          scheduled_date: utcDateStr,
          scheduled_time: utcTimeStr,
          user_timezone: userTimezone,
          social_platforms: selectedSocialPlatforms,
          generated_caption: generatedContent.caption,
          generated_hashtags: generatedContent.hashtags,
          media_url: imageUrl || null,
          status: postStatus
        });

      if (dbError) throw dbError;

      const newPost: PostData = {
        industry: industry.trim(),
        goal: goal.trim(),
        nicheInfo: nicheInfo.trim(),
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        generatedContent
      };

      // Increment monthly usage counter
      const { error: incrementError } = await supabase
        .rpc('increment_monthly_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Don't block the user, just log the error
      }

      setPosts(prev => [...prev, newPost]);
      setMonthlyPosts(prev => prev + 1);

      // Clear form and reset all state
      setIndustry('');
      setGoal('');
      setNicheInfo('');
      setScheduledDate('');
      setScheduledTime('');
      setUploadedImage(null);
      setUploadedImageUrl('');
      setIncludeEmojis(true);
      setSelectedSocialPlatforms([]);
      setCustomImagePrompt('');
      setGenerateWithImages(false);
      setGenerateCaptionWithAI(true);
      setManualCaption('');
      setManualHashtags('');

      // Clear any file inputs to prevent cross-form contamination
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id !== 'edit-dialog-file-input') { // Don't clear edit dialog input
          input.value = '';
        }
      });

      toast({
        title: "Content Generated!",
        description: "Your post has been generated and added to your collection",
      });

      // Notify parent component to refresh
      onPostCreated?.(newPost);

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
        title: "Creation Period Expired", 
        description: "Your 30-day creation period has expired. Contact support or upgrade to continue creating posts.",
        variant: "destructive",
      });
      return;
    }

    // Check period usage limit using subscription-based counting
    const remainingPosts = 10 - monthlyPosts;

    if (remainingPosts <= 0) {
      toast({
        title: "Period Limit Reached",
        description: "You've reached your Starter plan limit for this 30-day period",
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

      let baseImageUrl = '';
      if (uploadedImage) {
        const uploadedUrl = await uploadImageToStorage(uploadedImage);
        if (uploadedUrl) {
          baseImageUrl = uploadedUrl;
        }
      }

      for (let i = 0; i < Math.min(remainingPosts, 10); i++) {
        const currentGoal = i === 0 ? goal.trim() : `${goal.trim()} - ${variations[i % variations.length]}`;
        
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            userId: user?.id,
            industry: industry.trim(),
            goal: currentGoal,
            nicheInfo: nicheInfo.trim(),
            includeEmojis
          }
        });

        if (error) throw error;

        const generatedContent: GeneratedContent = {
          caption: data.caption,
          hashtags: data.hashtags,
          image: baseImageUrl,
          isGenerated: false
        };

        // Convert local time to UTC for storage
        let utcDateStr = null;
        let utcTimeStr = null;
        if (scheduledDate && scheduledTime) {
          const localDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
          const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
          utcDateStr = format(utcDate, 'yyyy-MM-dd');
          utcTimeStr = format(utcDate, 'HH:mm');
        }

        // Determine post status based on social media and scheduling
        let postStatus = 'draft';
        if (selectedSocialPlatforms.length > 0) {
          if (scheduledDate && scheduledTime) {
            postStatus = 'scheduled';
          } else {
            postStatus = 'ready'; // Has platforms but no schedule
          }
        }

        // Save to database
        const { error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            industry: industry.trim(),
            goal: currentGoal,
            niche_info: nicheInfo.trim() || null,
            scheduled_date: utcDateStr,
            scheduled_time: utcTimeStr,
            user_timezone: userTimezone,
            social_platforms: selectedSocialPlatforms,
            generated_caption: generatedContent.caption,
            generated_hashtags: generatedContent.hashtags,
            media_url: baseImageUrl || null,
            status: postStatus
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

        // Increment monthly usage counter
        const { error: incrementError } = await supabase
          .rpc('increment_monthly_usage', { user_uuid: user.id });

        if (incrementError) {
          console.error('Error incrementing usage:', incrementError);
          // Don't block the user, just log the error
        }

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
      setIncludeEmojis(true);
      setSelectedSocialPlatforms([]);
      setCustomImagePrompt('');

      toast({
        title: "Batch Generation Complete!",
        description: `Generated ${Math.min(remainingPosts, 10)} posts successfully`,
      });

      // Notify parent component to refresh
      onPostCreated?.();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 text-purple-600 mr-2" />
          Create Content
        </CardTitle>
        <CardDescription>
          Generate single posts or batch create content with scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Caption Generation Toggle - at the top */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="generate-caption-ai"
            checked={generateCaptionWithAI}
            onCheckedChange={(checked) => setGenerateCaptionWithAI(checked as boolean)}
          />
          <Label htmlFor="generate-caption-ai" className="text-sm font-medium">
            Create text caption and hashtags with AI
          </Label>
        </div>

        {/* AI Content Fields - shown when checkbox is checked */}
        {generateCaptionWithAI && (
          <>
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
              <Checkbox
                id="include-emojis"
                checked={includeEmojis}
                onCheckedChange={(checked) => setIncludeEmojis(checked as boolean)}
              />
              <Label htmlFor="include-emojis" className="text-sm">
                Include emojis in content
              </Label>
            </div>
          </>
        )}

        {/* Manual Caption and Hashtags - shown when AI is disabled */}
        {!generateCaptionWithAI && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="manual-caption">Caption *</Label>
                <span className="text-xs text-muted-foreground">
                  {manualCaption.length}/2000
                </span>
              </div>
              <Textarea
                id="manual-caption"
                placeholder="Write your post caption..."
                value={manualCaption}
                onChange={(e) => setManualCaption(e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="manual-hashtags">Hashtags</Label>
                <span className="text-xs text-muted-foreground">
                  {manualHashtags.length}/500
                </span>
              </div>
              <Textarea
                id="manual-hashtags"
                placeholder="#marketing #socialmedia #business (each hashtag must start with #)"
                value={manualHashtags}
                onChange={(e) => setManualHashtags(e.target.value)}
                maxLength={500}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Each hashtag must start with #. Separate hashtags with spaces.
              </p>
            </div>
          </div>
        )}

        {/* Social Media Selection */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Social Media Platforms</h4>
          <div className="grid grid-cols-2 gap-3">
            {socialPlatforms.map((platform) => {
              const isConnected = accounts.some(account => account.platform === platform.id && account.is_active);
              return (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedSocialPlatforms.includes(platform.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSocialPlatforms(prev => [...prev, platform.id]);
                      } else {
                        setSelectedSocialPlatforms(prev => prev.filter(id => id !== platform.id));
                      }
                    }}
                    disabled={!isConnected}
                  />
                  <Label 
                    htmlFor={platform.id} 
                    className={`text-sm ${!isConnected ? 'text-muted-foreground' : ''}`}
                  >
                    {platform.name} {!isConnected && '(Not connected)'}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Connect <Link to="/dashboard" className="text-primary hover:underline">social accounts</Link> in the Social Media Accounts section to enable posting.
          </p>
        </div>

        {/* Scheduling Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Post (Optional)
          </h4>
          {selectedSocialPlatforms.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <p className="text-sm text-yellow-700">
                Select at least one social media platform to enable scheduling
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="scheduledDate" className="text-sm">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="text-sm"
                disabled={selectedSocialPlatforms.length === 0}
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
                disabled={selectedSocialPlatforms.length === 0}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your timezone: {timezoneDisplay}. Choose the date and time in your local time; we'll automatically convert it to UTC for publishing.
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Media (Optional)</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="main-form-file-input" className="text-sm">Upload Image</Label>
              <input
                id="main-form-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={generateWithImages}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploadedImage && !generateWithImages && (
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadedImage.name}
                </p>
              )}
            </div>
            
            {uploadedImageUrl && (
              <div className={`relative ${generateWithImages ? 'opacity-50' : ''}`}>
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
                  disabled={generateWithImages}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                >
                  ×
                </Button>
              </div>
            )}
            {generateWithImages && uploadedImageUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload disabled - only AI images will be used when AI generation is enabled
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-images"
                  checked={generateWithImages}
                  onCheckedChange={(checked) => setGenerateWithImages(checked as boolean)}
                />
                <Label htmlFor="generate-images" className="text-sm">
                  Generate AI image
                </Label>
              </div>
              
              {generateWithImages && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="image-prompt" className="text-sm">Image Description (Optional)</Label>
                  <Textarea
                    id="image-prompt"
                    placeholder="Describe how you want your image to look... e.g., 'Modern office setting with laptop, professional lighting, blue color scheme'"
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 DALL-E 3 creates images from text descriptions only. Describe visual elements like colors, style, objects, and composition for best results.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleGenerateSingle}
            disabled={isGenerating || monthlyPosts >= 10 || !canCreatePosts || (generateCaptionWithAI ? (!industry.trim() || !goal.trim()) : !manualCaption.trim())}
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
                {generateCaptionWithAI ? 'Generate Single Post' : 'Create Post'}
              </>
            )}
          </Button>

          {generateCaptionWithAI && (
            <Button
              onClick={handleGenerateAll10}
              disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
              variant="outline"
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Remaining Posts ({10 - monthlyPosts} left)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCreationForm;
