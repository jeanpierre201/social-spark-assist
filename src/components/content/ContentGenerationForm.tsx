import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
          nicheInfo: nicheInfo.trim()
        }
      });

      if (error) throw error;

      // Increment monthly usage counter
      const { data: newUsageCount, error: incrementError } = await supabase
        .rpc('increment_monthly_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Don't block the user, just log the error
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
        media_url: imageUrl,
      };

      onPostCreated(newPost);
      setIndustry('');
      setGoal('');
      setNicheInfo('');
      setScheduledDate(null);
      setScheduledTime('');
      setImageUrl(null);

      toast({
        title: "Content generated successfully!",
        description: `You have used ${(newUsageCount || currentMonthlyUsage + 1)} of your monthly posts.`,
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Oh no! Something went wrong.",
        description: error.message || "Edge Function returned a non-2xx status code",
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-images"
                checked={generateWithImages}
                onCheckedChange={(checked) => setGenerateWithImages(checked as boolean)}
                disabled={!!selectedImage}
              />
              <Label htmlFor="generate-images" className="text-sm">
                Generate AI images (Coming soon) {selectedImage && '- Disabled when image uploaded'}
              </Label>
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
                Times are stored in UTC. Your local time will be converted automatically.
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