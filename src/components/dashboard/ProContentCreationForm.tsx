import { useState } from 'react';
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

interface ProContentCreationFormProps {
  monthlyPosts: number;
  setMonthlyPosts: (value: number | ((prev: number) => number)) => void;
  canCreatePosts: boolean;
  setPosts: (value: PostData[] | ((prev: PostData[]) => PostData[])) => void;
  onPostCreated?: () => void;
}

const ProContentCreationForm = ({ monthlyPosts, setMonthlyPosts, canCreatePosts, setPosts, onPostCreated }: ProContentCreationFormProps) => {
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

  const socialPlatforms = [
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'snapchat', name: 'Snapchat' }
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
        title: "Subscription Required",
        description: "Post creation requires an active Pro subscription.",
        variant: "destructive",
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

    if (currentMonthlyUsage >= 100) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your Pro plan limit of 100 posts per month.",
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
          nicheInfo: nicheInfo.trim(),
          includeEmojis
        }
      });

      if (error) throw error;

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
          let imagePrompt = customImagePrompt.trim() || `Create a professional image for ${industry.trim()} industry. Goal: ${goal.trim()}`;
          if (!customImagePrompt.trim() && nicheInfo.trim()) {
            imagePrompt += `. Target audience: ${nicheInfo.trim()}`;
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
            const storagePath = `ai-images/${user.id}/${timestamp}-generated.png`;

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
          toast({
            title: "Image generation failed", 
            description: "Content was created but image generation failed.",
            variant: "destructive",
          });
        }
      }

      const generatedContent: GeneratedContent = {
        caption: data.caption,
        hashtags: data.hashtags,
        image: imageUrl,
        isGenerated: isImageGenerated
      };

      // Determine post status based on scheduling and social media selection
      let postStatus = 'draft';
      if (scheduledDate && scheduledTime && selectedSocialPlatforms.length > 0) {
        postStatus = 'scheduled';
      }

      // Save to database
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

      // Clear any file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id !== 'edit-dialog-file-input') {
          input.value = '';
        }
      });

      toast({
        title: "Content Generated!",
        description: "Your post has been generated and added to your collection",
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
        title: "Subscription Required",
        description: "Post creation requires an active Pro subscription.",
        variant: "destructive",
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
    const remainingPosts = Math.min(10, 100 - currentMonthlyUsage);

    if (remainingPosts <= 0) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've already used all 100 posts for this month",
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

      for (let i = 0; i < remainingPosts; i++) {
        const currentGoal = i === 0 ? goal.trim() : `${goal.trim()} - ${variations[i % variations.length]}`;
        
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
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

        // Determine post status based on scheduling and social media selection
        let postStatus = 'draft';
        if (scheduledDate && scheduledTime && selectedSocialPlatforms.length > 0) {
          postStatus = 'scheduled';
        }

        // Save to database
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
            media_url: baseImageUrl || null,
            status: postStatus
          });

        if (dbError) throw dbError;

        // Increment monthly usage counter
        const { error: incrementError } = await supabase
          .rpc('increment_monthly_usage', { user_uuid: user.id });

        if (incrementError) {
          console.error('Error incrementing usage:', incrementError);
        }

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

      // Clear any file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id !== 'edit-dialog-file-input') {
          input.value = '';
        }
      });

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
      setIsGenerating(false);
    }
  };

  const connectedPlatforms = accounts.filter(account => account.is_active);
  const remainingPosts = Math.max(0, 100 - monthlyPosts);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generate Social Media Content
        </CardTitle>
        <CardDescription>
          Enter your business details to generate engaging content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <Link to="/social-accounts" className="text-blue-600 hover:underline">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="scheduled-date" className="text-sm">Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
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
              />
            </div>
          </div>
          {scheduledDate && scheduledTime && selectedSocialPlatforms.length === 0 && (
            <p className="text-sm text-orange-600 mt-2">
              Select at least one social platform to schedule posts
            </p>
          )}
        </div>

        {/* Generate Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button 
            onClick={handleGenerateSingle}
            disabled={!industry.trim() || !goal.trim() || isGenerating}
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
                Generate Content
              </>
            )}
          </Button>

          {remainingPosts > 1 && (
            <Button 
              onClick={handleGenerate10Posts}
              disabled={!industry.trim() || !goal.trim() || isGenerating}
              variant="outline"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                remainingPosts >= 10 ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate 10 Posts
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
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