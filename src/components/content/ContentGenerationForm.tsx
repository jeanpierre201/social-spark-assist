import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
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

  const socialPlatforms = [
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'snapchat', name: 'Snapchat' }
  ];

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
          includeEmojis: includeEmojis
        }
      });

      if (error) throw error;

      // Generate AI image if requested
      let generatedImageUrl = imageUrl; // Use uploaded image if available
      if (generateWithImages) {
        try {
          let imagePrompt = '';
          
          // If user provided a custom prompt, use it as the primary prompt
          if (customImagePrompt.trim()) {
            imagePrompt = customImagePrompt.trim();
            
            // Only add context if the custom prompt doesn't seem complete
            if (!customImagePrompt.toLowerCase().includes(industry.toLowerCase())) {
              imagePrompt += `. Context: ${industry.trim()} industry, Goal: ${goal.trim()}`;
            }
          } else {
            // Default prompt if no custom prompt provided
            imagePrompt = `Create a professional image for ${industry.trim()} industry. Goal: ${goal.trim()}`;
            if (nicheInfo.trim()) {
              imagePrompt += `. Target audience: ${nicheInfo.trim()}`;
            }
          }
          
          if (selectedImage && imageUrl) {
            imagePrompt += ". Please incorporate elements from the existing uploaded image (like logos, branding, etc.) into the new AI-generated image";
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

      // Increment monthly usage counter
      const { data: newUsageCount, error: incrementError } = await supabase
        .rpc('increment_monthly_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Don't block the user, just log the error
      }

      // Determine post status based on scheduling and social media selection
      let postStatus = 'draft';
      if (scheduledDate && scheduledTime && selectedSocialPlatforms.length > 0) {
        postStatus = 'scheduled';
      }

      const newPost = {
        user_id: user.id,
        generated_caption: data.caption,
        generated_hashtags: data.hashtags,
        industry: industry.trim(),
        goal: goal.trim(),
        niche_info: nicheInfo.trim() || null,
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
        scheduled_time: scheduledTime || null,
        media_url: generatedImageUrl,
        status: postStatus,
      };

      onPostCreated(newPost);
      setIndustry('');
      setGoal('');
      setNicheInfo('');
      setScheduledDate(null);
      setScheduledTime('');
      setImageUrl(null);
      setSelectedSocialPlatforms([]);
      setCustomImagePrompt('');

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
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {isImageUploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Uploaded" className="max-h-32 rounded-md" />
                  </div>
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
                  Generate AI images {selectedImage && '(will incorporate uploaded image)'}
                </Label>
              </div>
              
              {generateWithImages && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="image-prompt" className="text-sm">Custom Image Description (Optional)</Label>
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
                    {selectedImage 
                      ? "Your uploaded private image (logo, icon, etc.) will be incorporated into the AI-generated image for enhanced brand consistency."
                      : "💡 Pro tip: Upload a private image above (logo, brand elements, or personal photo) to enhance your AI-generated content. The AI will incorporate your image into the generated visual for better brand alignment."
                    }
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

        {/* Upgrade prompt for free users */}
        {isFreeUser && (
          <div className="border-t pt-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Want more features?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Upgrade to unlock scheduling, platform selection, image uploads, and more posts per month!
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
          disabled={isGenerating || !industry.trim() || !goal.trim()}
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
              Generate Content
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContentGenerationForm;