import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useBrand } from '@/hooks/useBrand';
import { useCampaigns } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Sparkles, Calendar, Clock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { fromZonedTime } from 'date-fns-tz';

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
  generated_caption?: string;
  generated_hashtags?: string[];
  media_url?: string;
  created_at?: string;
}

interface ProContentCreationFormProps {
  monthlyPosts: number;
  setMonthlyPosts: (value: number | ((prev: number) => number)) => void;
  canCreatePosts: boolean;
  setPosts: (value: PostData[] | ((prev: PostData[]) => PostData[])) => void;
  onPostCreated?: (post?: PostData) => void;
}

const ProContentCreationForm = ({ monthlyPosts, setMonthlyPosts, canCreatePosts, setPosts, onPostCreated }: ProContentCreationFormProps) => {
  const { user } = useAuth();
  const { accounts } = useSocialAccounts();
  const { brand } = useBrand();
  const { campaigns } = useCampaigns();
  const { toast } = useToast();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerating10, setIsGenerating10] = useState(false);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<string[]>([]);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [generateCaptionWithAI, setGenerateCaptionWithAI] = useState(true);
  const [manualCaption, setManualCaption] = useState('');
  const [manualHashtags, setManualHashtags] = useState('');
  const [includeBrand, setIncludeBrand] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [timezoneDisplay, setTimezoneDisplay] = useState<string>('');

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

  // Auto-select brand checkbox if brand has at least a name
  useEffect(() => {
    if (brand?.name) {
      setIncludeBrand(true);
    }
  }, [brand]);

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
      const uploadedUrl = await uploadImageToStorage(file);
      
      if (uploadedUrl) {
        setUploadedImage(file);
        setUploadedImageUrl(uploadedUrl);
        
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

    // Check if user has reached the Pro plan limit of 100 posts in their 30-day period
    if (monthlyPosts >= 100) {
      toast({
        title: "Period Limit Reached",
        description: "You've reached your Pro plan limit of 100 posts in your 30-day period.",
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
        // Build brand/campaign context for AI
        const brandContext: Record<string, string> = {};
        if (includeBrand && brand) {
          if (brand.name) brandContext.brandName = brand.name;
          if (brand.voice_tone) brandContext.brandVoiceTone = brand.voice_tone;
          if (brand.description) brandContext.brandDescription = brand.description;
          if (brand.tagline) brandContext.brandTagline = brand.tagline;
        }
        const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
        if (includeBrand && selectedCampaign) {
          brandContext.campaignName = selectedCampaign.name;
          if (selectedCampaign.description) brandContext.campaignDescription = selectedCampaign.description;
        }

        // Generate with AI
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            userId: user?.id,
            industry: industry.trim(),
            goal: goal.trim(),
            nicheInfo: nicheInfo.trim(),
            includeEmojis,
            ...brandContext,
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

          // Add brand colors to image prompt
          if (includeBrand && brand) {
            if (brand.name) imagePrompt += `. Brand: ${brand.name}`;
            if (brand.color_primary) imagePrompt += `. Use brand primary color ${brand.color_primary}`;
            if (brand.color_secondary) imagePrompt += ` and secondary color ${brand.color_secondary} in the design`;
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

      // Determine post status based on social media and scheduling
      let postStatus = 'draft';
      if (selectedSocialPlatforms.length > 0) {
        if (scheduledDate && scheduledTime) {
          postStatus = 'scheduled';
        } else {
          postStatus = 'ready';
        }
      }

      // Convert local time to UTC for storage
      let utcDateStr: string | null = null;
      let utcTimeStr: string | null = null;
      if (scheduledDate && scheduledTime) {
        const localDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
        const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
        utcDateStr = utcDate.toISOString().split('T')[0];
        utcTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5);
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
          uploaded_image_url: (!isImageGenerated && imageUrl) ? imageUrl : null,
          ai_generated_image_1_url: isImageGenerated ? imageUrl : null,
          selected_image_type: isImageGenerated ? 'ai_generated_1' : (imageUrl ? 'uploaded' : null),
          status: postStatus,
          brand_id: includeBrand && brand?.id ? brand.id : null,
          campaign_id: includeBrand && selectedCampaignId && selectedCampaignId !== 'none' ? selectedCampaignId : null,
        });

      if (dbError) throw dbError;

      const newPost: PostData = {
        industry: industry.trim(),
        goal: goal.trim(),
        nicheInfo: nicheInfo.trim(),
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        generatedContent,
        generated_caption: caption,
        generated_hashtags: hashtags,
        media_url: imageUrl || undefined
      };

      // Increment monthly usage counter
      const { error: incrementError } = await supabase
        .rpc('increment_monthly_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
      }

      // Notify parent component FIRST
      onPostCreated?.(newPost);

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

      // Clear any file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id !== 'edit-dialog-file-input') {
          input.value = '';
        }
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

  const handleGenerate10Posts = async () => {
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

    // Check if user has reached the Pro plan limit of 100 posts in their 30-day period
    const remainingPosts = Math.min(10, 100 - monthlyPosts);

    if (remainingPosts <= 0) {
      toast({
        title: "Period Limit Reached",
        description: "You've reached your Pro plan limit of 100 posts in your 30-day period.",
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

    setIsGenerating10(true);

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

      for (let i = 0; i < remainingPosts; i++) {
        const currentGoal = i === 0 ? goal.trim() : `${goal.trim()} - ${variations[i % variations.length]}`;
        
        // Build brand/campaign context for AI
        const brandContext: Record<string, string> = {};
        if (includeBrand && brand) {
          if (brand.name) brandContext.brandName = brand.name;
          if (brand.voice_tone) brandContext.brandVoiceTone = brand.voice_tone;
          if (brand.description) brandContext.brandDescription = brand.description;
          if (brand.tagline) brandContext.brandTagline = brand.tagline;
        }
        const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
        if (includeBrand && selectedCampaign) {
          brandContext.campaignName = selectedCampaign.name;
          if (selectedCampaign.description) brandContext.campaignDescription = selectedCampaign.description;
        }

        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            userId: user?.id,
            industry: industry.trim(),
            goal: currentGoal,
            nicheInfo: nicheInfo.trim(),
            includeEmojis,
            ...brandContext,
          }
        });

        if (error) throw error;

        let imageUrl = baseImageUrl;
        let isImageGenerated = false;

        // Generate AI image if requested for each post
        if (generateWithImages) {
          try {
            let imagePrompt = customImagePrompt.trim() || `Create a professional image for ${industry.trim()} industry. Goal: ${currentGoal}`;
            if (!customImagePrompt.trim() && nicheInfo.trim()) {
              imagePrompt += `. Target audience: ${nicheInfo.trim()}`;
            }
            // Add brand colors to batch image prompt
            if (includeBrand && brand) {
              if (brand.name) imagePrompt += `. Brand: ${brand.name}`;
              if (brand.color_primary) imagePrompt += `. Use brand primary color ${brand.color_primary}`;
              if (brand.color_secondary) imagePrompt += ` and secondary color ${brand.color_secondary} in the design`;
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
            } else if (imageData?.image) {
              // Convert base64 to blob and upload to storage
              const base64Data = imageData.image.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/png' });

              const timestamp = new Date().getTime();
              const storagePath = `ai-images/${user.id}/${timestamp}-generated-${i}.png`;

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('media')
                .upload(storagePath, blob, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadError) {
                const { data: publicUrlData } = supabase.storage
                  .from('media')
                  .getPublicUrl(uploadData.path);
                
                imageUrl = publicUrlData.publicUrl;
                isImageGenerated = true;
              }
            }
          } catch (imageError) {
            console.error('AI image generation error:', imageError);
          }
        }

        const generatedContent: GeneratedContent = {
          caption: data.caption,
          hashtags: data.hashtags,
          image: imageUrl,
          isGenerated: isImageGenerated
        };

        // Determine post status based on social media and scheduling
        let postStatus = 'draft';
        if (selectedSocialPlatforms.length > 0) {
          if (scheduledDate && scheduledTime) {
            postStatus = 'scheduled';
          } else {
            postStatus = 'ready';
          }
        }

        // Convert local time to UTC for storage
        let utcDateStr: string | null = null;
        let utcTimeStr: string | null = null;
        if (scheduledDate && scheduledTime) {
          const localDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
          const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
          utcDateStr = utcDate.toISOString().split('T')[0];
          utcTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5);
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
            media_url: imageUrl || null,
            uploaded_image_url: (!isImageGenerated && imageUrl) ? imageUrl : null,
            ai_generated_image_1_url: isImageGenerated ? imageUrl : null,
            selected_image_type: isImageGenerated ? 'ai_generated_1' : (imageUrl ? 'uploaded' : null),
            status: postStatus,
            brand_id: includeBrand && brand?.id ? brand.id : null,
            campaign_id: includeBrand && selectedCampaignId && selectedCampaignId !== 'none' ? selectedCampaignId : null,
          });

        if (dbError) throw dbError;

        // The monthlyPosts counter is already incremented via setMonthlyPosts below

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

      // Don't clear form after generating multiple posts

      toast({
        title: `Generated ${Math.min(remainingPosts, 10)} Posts!`,
        description: "Your posts have been generated and added to your collection",
      });

      onPostCreated?.();

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating10(false);
    }
  };

  const connectedPlatforms = accounts.filter(account => account.is_active);
  const remainingPosts = Math.max(0, 100 - monthlyPosts);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Create Content
        </CardTitle>
        <CardDescription>
          Enter your business details to generate engaging content.
        </CardDescription>
      </CardHeader>
        <CardContent className="space-y-4">
        {/* Brand Context Toggle */}
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-brand"
              checked={includeBrand}
              onCheckedChange={(checked) => {
                setIncludeBrand(checked as boolean);
                if (!checked) setSelectedCampaignId('');
              }}
              disabled={!brand?.name}
            />
            <Label htmlFor="include-brand" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Include Brand context
              {brand?.name && (
                <span className="text-xs text-muted-foreground">({brand.name})</span>
              )}
            </Label>
          </div>
          {!brand?.name && (
            <p className="text-xs text-muted-foreground ml-6">
              <Link to="/dashboard/brand" className="text-primary underline">Create a brand profile</Link> to enable this option.
            </p>
          )}

          {/* Campaign Selector - only if brand is included */}
          {includeBrand && (
            <div className="ml-6 space-y-1">
              <Label htmlFor="campaign-select" className="text-sm">Campaign (optional)</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger id="campaign-select" className="w-full">
                  <SelectValue placeholder="No campaign selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  <Link to="/dashboard/campaigns" className="text-primary underline">Create a campaign</Link> to organize your content.
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI Caption Generation Toggle */}
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
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Fashion, Food..."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
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

            <div className="grid gap-2">
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

        {/* Image Upload and AI Generation */}
        <div className="space-y-4">
          <div>
            <Label>Image Upload</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={generateWithImages}
            />
            {uploadedImage && !generateWithImages && (
              <p className="text-sm text-muted-foreground mt-1">
                {uploadedImage.name}
              </p>
            )}
            {uploadedImageUrl && (
              <div className={`mt-2 relative inline-block ${generateWithImages ? 'opacity-50' : ''}`}>
                <img 
                  src={uploadedImageUrl} 
                  alt="Uploaded preview" 
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedImageUrl('');
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            {generateWithImages && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload disabled - only AI images will be used when AI generation is enabled
              </p>
            )}
          </div>

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
                        setSelectedSocialPlatforms(prev => prev.filter(p => p !== platform.id));
                      }
                    }}
                    disabled={!isConnected}
                  />
                  <Label 
                    htmlFor={platform.id} 
                    className={`text-sm ${isConnected ? '' : 'text-muted-foreground'}`}
                  >
                    {platform.name}
                    {!isConnected && (
                      <span className="text-xs block text-orange-600">
                        Not connected
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
          {connectedPlatforms.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/dashboard/social" className="text-primary hover:underline">
                Connect your social media accounts
              </Link> to enable scheduling and direct posting.
            </p>
          )}
        </div>

        {/* Scheduling */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Post (Optional)
          </h4>
          {selectedSocialPlatforms.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <p className="text-sm text-yellow-700">
                Select at least one social media platform to enable scheduling
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="scheduled-date" className="text-sm">Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
                disabled={selectedSocialPlatforms.length === 0}
              />
            </div>
            <div>
              <Label htmlFor="scheduled-time" className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <Input
                id="scheduled-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1"
                disabled={selectedSocialPlatforms.length === 0}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your timezone: {timezoneDisplay}. Choose the date and time in your local time; we'll automatically convert it to UTC for publishing.
          </p>
        </div>

        {/* Generate Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button 
            onClick={handleGenerateSingle}
            disabled={(generateCaptionWithAI ? (!industry.trim() || !goal.trim()) : !manualCaption.trim()) || isGenerating || isGenerating10}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {generateCaptionWithAI ? 'Generate Content' : 'Create Post'}
              </>
            )}
          </Button>

          {remainingPosts > 1 && generateCaptionWithAI && (
            <Button 
              onClick={handleGenerate10Posts}
              disabled={!industry.trim() || !goal.trim() || isGenerating || isGenerating10}
              variant="outline"
              className="w-full"
            >
              {isGenerating10 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                remainingPosts >= 10 ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate 10 Posts
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Remaining Posts ({remainingPosts} left)
                  </>
                )
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProContentCreationForm;