import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useManualPublish } from '@/hooks/useManualPublish';
import { useBrand } from '@/hooks/useBrand';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Calendar, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { applyLogoOverlay, LogoPlacement } from '@/utils/logoOverlay';
import { BUSINESS_TYPES } from '@/config/businessTypes';

interface ContentGenerationFormProps {
  currentMonthPosts: number;
  isProUser: boolean;
  isStarterUser: boolean;
  isFreeUser: boolean;
  onPostCreated: (newPost: any) => void;
}

const ContentGenerationForm = ({ currentMonthPosts, isProUser, isStarterUser, isFreeUser, onPostCreated }: ContentGenerationFormProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { accounts } = useSocialAccounts();
  const { publishToMastodon, isPublishingPost } = useManualPublish();
  const { brand } = useBrand();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industry, setIndustry] = useState('');
  const [otherBusinessType, setOtherBusinessType] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');

  // final value used in payload/validation (handles the "Other" case)
  const businessTypeValue = industry === 'Other' ? otherBusinessType.trim() : industry.trim();
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generateWithImages, setGenerateWithImages] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<string[]>([]);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [lastGeneratedPost, setLastGeneratedPost] = useState<any>(null);
  const [generateCaptionWithAI, setGenerateCaptionWithAI] = useState(true);
  const [manualCaption, setManualCaption] = useState('');
  const [manualHashtags, setManualHashtags] = useState('');
  const [includeBrand, setIncludeBrand] = useState(false);
  // Free tier platforms - only Mastodon and Telegram
  const freePlatforms = [
    { id: 'mastodon', name: 'Mastodon' },
    { id: 'telegram', name: 'Telegram' }
  ];

  // auto-enable the checkbox if a brand exists with any data
  useEffect(() => {
    if (brand && (brand.name || brand.tagline || brand.description || brand.voice_tone || brand.visual_style || brand.color_primary || brand.color_secondary || brand.logo_url)) {
      setIncludeBrand(true);
    }
  }, [brand]);

  // Auto-populate business type from brand if available
  useEffect(() => {
    if (brand?.business_type) {
      if (BUSINESS_TYPES.includes(brand.business_type)) {
        setIndustry(brand.business_type);
        setOtherBusinessType('');
      } else {
        setIndustry('Other');
        setOtherBusinessType(brand.business_type);
      }
    }
  }, [brand?.business_type]);

  const socialPlatforms = [
    { id: 'mastodon', name: 'Mastodon' },
    { id: 'telegram', name: 'Telegram' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'x', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' }
  ];

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

  const handleGenerateContent = async () => {
    if (!user) {
      toast({
        title: "You must be logged in to generate content.",
      });
      return;
    }

    // Check monthly usage limit using the new tracking system
    const { data: monthlyUsage, error: usageError } = await supabase
      .rpc('get_monthly_usage_count', { user_uuid: user.id });

    if (usageError) {
      console.error('Error checking monthly usage:', usageError);
      toast({
        title: "Error checking usage limits",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    const currentMonthlyUsage = monthlyUsage || 0;

    // Free users get 1 post per month
    if (isFreeUser && currentMonthlyUsage >= 1) {
      toast({
        title: "Monthly limit reached",
        description: "Free users can generate 1 post per month. Upgrade to get more posts!",
      });
      navigate('/#pricing');
      return;
    }

    // Starter users get 10 posts per month
    if (isStarterUser && currentMonthlyUsage >= 10) {
      toast({
        title: "You've reached your monthly limit.",
        description: "Upgrade to Pro for unlimited content generation.",
      });
      navigate('/upgrade-pro');
      return;
    }

    // Validate based on content mode
    if (generateCaptionWithAI) {
      if (!businessTypeValue || !goal.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in at least business type and goal fields",
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
        // build payload with optional brand context
        const payload: any = {
          industry: businessTypeValue,
          goal: goal.trim(),
          nicheInfo: nicheInfo.trim(),
          includeEmojis: includeEmojis,
          userId: user.id,
        };
        if (includeBrand && brand) {
          payload.brandName = brand.name;
          payload.brandVoiceTone = brand.voice_tone;
          payload.brandDescription = brand.description;
          payload.brandTagline = brand.tagline;
        }

        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: payload
        });

        if (error) {
          console.error('Error generating content:', error);
          
          // Check if it's a limit reached error
          if (data?.limitReached) {
            toast({
              title: "Monthly limit reached",
              description: data.error || "The amount of free calls has been achieved, please wait for the first day of the coming month or upgrade to a Starter plan",
              variant: "destructive",
            });
            navigate('/#pricing');
            setIsGenerating(false);
            return;
          }
          
          throw error;
        }
        caption = data.caption;
        hashtags = data.hashtags;
      } else {
        // Use manual content
        caption = manualCaption.trim();
        hashtags = parseHashtags(manualHashtags);
      }

      // Generate AI image if requested
      let generatedImageUrl = imageUrl; // Use uploaded image if available
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
            imagePrompt = `Create a professional image for ${businessTypeValue} business type. Goal: ${goal.trim()}`;
            if (nicheInfo.trim()) {
              imagePrompt += `. Target audience: ${nicheInfo.trim()}`;
            }
          }

          // include brand colors/styles when requested
          if (includeBrand && brand) {
            if (brand.color_primary) {
              imagePrompt += `. Use brand primary color ${brand.color_primary}`;
            }
            if (brand.color_secondary) {
              imagePrompt += ` and secondary color ${brand.color_secondary}`;
            }
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
            const fileName = Math.random().toString(36).substring(2, 15);
            const storagePath = `${user.id}/${fileName}.png`;

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
              
              generatedImageUrl = publicUrlData.publicUrl;
              setImageUrl(generatedImageUrl);
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

      // apply logo overlay if brand context is included and logo placement enabled
      if (generatedImageUrl && includeBrand && brand?.logo_url && brand.logo_placement && brand.logo_placement !== 'none') {
        try {
          const overlayBlob = await applyLogoOverlay({
            imageUrl: generatedImageUrl,
            logoUrl: brand.logo_url,
            placement: brand.logo_placement as LogoPlacement,
            watermark: brand.watermark_enabled || false,
            watermarkOpacity: brand.watermark_opacity ?? 0.5,
          });

          const timestamp2 = new Date().getTime();
          const storagePath2 = `${user.id}/${timestamp2}-branded.png`;
          const { data: uploadData2, error: uploadError2 } = await supabase.storage
            .from('media')
            .upload(storagePath2, overlayBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/png',
            });

          if (!uploadError2 && uploadData2) {
            const { data: publicUrlData2 } = supabase.storage
              .from('media')
              .getPublicUrl(uploadData2.path);
            generatedImageUrl = publicUrlData2.publicUrl;
            setImageUrl(generatedImageUrl);
          }
        } catch (overlayError) {
          console.error('Logo overlay failed:', overlayError);
        }
      }

      // Increment monthly usage counter
      const { data: newUsageCount, error: incrementError } = await supabase
        .rpc('increment_monthly_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Don't block the user, just log the error
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

      const newPost: any = {
        user_id: user.id,
        generated_caption: caption,
        generated_hashtags: hashtags,
        industry: businessTypeValue,
        goal: goal.trim(),
        niche_info: nicheInfo.trim() || null,
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
        scheduled_time: scheduledTime || null,
        media_url: generatedImageUrl,
        status: postStatus,
        social_platforms: selectedSocialPlatforms,
      };
      // include brand reference for starter/pro users
      if (includeBrand && brand?.id) {
        newPost.brand_id = brand.id;
      }

      // Save post to database for all users (free users see posts for 24 hours only)
      setLastGeneratedPost(newPost);
      onPostCreated(newPost);
      
      setIndustry('');
    setOtherBusinessType('');
      setGoal('');
      setNicheInfo('');
      setScheduledDate(null);
      setScheduledTime('');
      setImageUrl(null);
      setSelectedSocialPlatforms([]);
      setCustomImagePrompt('');
      setGenerateCaptionWithAI(true);
      setManualCaption('');
      setManualHashtags('');

      toast({
        title: "Content generated successfully!",
        description: `You have used ${(newUsageCount || currentMonthlyUsage + 1)} of your monthly posts.`,
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      
      // Handle specific error types
      let errorTitle = "Oh no! Something went wrong.";
      let errorDescription = "Please try again.";
      
      if (error.message.includes('insufficient_quota')) {
        errorTitle = "OpenAI API Quota Exceeded";
        errorDescription = "You've exceeded your OpenAI API quota. Please check your plan and billing details at https://platform.openai.com/account/billing";
      } else if (error.message.includes('rate_limit_exceeded')) {
        errorTitle = "Rate Limit Exceeded";
        errorDescription = "Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes('invalid_api_key')) {
        errorTitle = "Invalid API Key";
        errorDescription = "The OpenAI API key is invalid. Please check your configuration.";
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Please select an image to upload.",
      });
      return;
    }

    setSelectedImage(file);
    setIsImageUploading(true);

    try {
      const timestamp = new Date().getTime();
      const storagePath = `images/${user?.id}/${timestamp}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      setImageUrl(publicUrlData.publicUrl);

      toast({
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Failed to upload image.",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Social Media Content</CardTitle>
        <CardDescription>
          {isFreeUser 
            ? "Generate 1 free post per month. Upgrade for more posts and advanced features!"
            : "Enter your business details to generate engaging content."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* brand toggle for Starter/Pro users (moved to very top) */}
        {(isStarterUser || isProUser) && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-brand"
                checked={includeBrand}
                onCheckedChange={(checked) => setIncludeBrand(checked as boolean)}
                disabled={!brand?.id}
              />
              <Label htmlFor="include-brand" className="text-sm">
                Include brand styling
              </Label>
            </div>
            {!brand?.id && (
              <p className="text-xs text-muted-foreground mt-1">
                Define your brand in <Link to="/dashboard/brand" className="text-primary hover:underline">Brand Profile</Link> to use this option.
              </p>
            )}
          </div>
        )}

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
            <div className="grid gap-2">
              <Label htmlFor="industry">Business type *</Label>
              <Select value={industry} onValueChange={(val) => {
                setIndustry(val);
                if (val !== 'Other') setOtherBusinessType('');
              }}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {industry === 'Other' && (
                <Input
                  id="industry-other"
                  placeholder="Enter business type"
                  value={otherBusinessType}
                  onChange={(e) => setOtherBusinessType(e.target.value)}
                  maxLength={100}
                  className="mt-2"
                />
              )}
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


        {/* Advanced features for subscribed users only */}
        {!isFreeUser && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div>
                <Label>Image Upload</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={generateWithImages}
                />
                {isImageUploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
                {selectedImage && !generateWithImages && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedImage.name}
                  </p>
                )}
                {imageUrl && (
                  <div className={`mt-2 ${generateWithImages ? 'opacity-50' : ''}`}>
                    <img src={imageUrl} alt="Uploaded" className="max-h-32 rounded-md" />
                  </div>
                )}
                {generateWithImages && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload disabled - only AI images will be used when AI generation is enabled
                  </p>
                )}
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="scheduledDate" className="text-sm">Date</Label>
                  <Input
                    type="date"
                    id="scheduledDate"
                    value={scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setScheduledDate(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime" className="text-sm">Time (UTC)</Label>
                  <Input
                    type="time"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Post will be set to 'Scheduled' when date, time and at least one social platform is selected.
              </p>
            </div>
          </>
        )}

        {/* Free user platform selection and Post Now */}
        {isFreeUser && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Post to (Free Tier)</h4>
              <div className="grid grid-cols-2 gap-3">
                {freePlatforms.map((platform) => {
                  const isConnected = accounts.some(account => account.platform === platform.id && account.is_active);
                  return (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`free-${platform.id}`}
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
                        htmlFor={`free-${platform.id}`} 
                        className={`text-sm ${!isConnected ? 'text-muted-foreground' : ''}`}
                      >
                        {platform.name} {!isConnected && '(Not connected)'}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Connect <Link to="/dashboard" className="text-primary hover:underline">social accounts</Link> to enable posting.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Want more features?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Upgrade to unlock scheduling, more platforms, image uploads, and more posts per month!
              </p>
              <Button 
                onClick={() => navigate('/#pricing')}
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                View Plans
              </Button>
            </div>
          </div>
        )}

        <Button 
          onClick={handleGenerateContent}
          disabled={isGenerating || (generateCaptionWithAI ? (!businessTypeValue || !goal.trim()) : !manualCaption.trim())}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {generateCaptionWithAI ? 'Generate Content' : 'Create Post'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContentGenerationForm;