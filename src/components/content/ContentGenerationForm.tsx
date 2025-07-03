
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ContentGenerationFormProps {
  currentMonthPosts: number;
  isProUser: boolean;
  isStarterUser: boolean;
  onPostCreated: (newPost: any) => void;
}

const ContentGenerationForm = ({ currentMonthPosts, isProUser, isStarterUser, onPostCreated }: ContentGenerationFormProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateContent = async () => {
    if (!user) {
      toast({
        title: "You must be logged in to generate content.",
      });
      return;
    }

    if (!subscribed) {
      toast({
        title: "Subscribe to generate content.",
        description: "You need an active subscription to use this feature.",
      });
      navigate('/#pricing');
      return;
    }

    if (isStarterUser && currentMonthPosts >= 10) {
      toast({
        title: "You've reached your monthly limit.",
        description: "Upgrade to Pro for unlimited content generation.",
      });
      navigate('/upgrade-pro');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newPost = {
        user_id: user.id,
        content: result.content,
        platform: selectedPlatform,
        created_at: new Date().toISOString(),
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
        scheduled_time: scheduledTime || null,
        image_url: imageUrl,
      };

      onPostCreated(newPost);
      setPrompt('');
      setScheduledDate(null);
      setScheduledTime('');
      setImageUrl(null);

      toast({
        title: "Content generated successfully!",
        description: "Your post has been saved.",
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Oh no! Something went wrong.",
        description: error.message,
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
        .from('social-posts')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/social-posts/${data.path}`;
      setImageUrl(publicUrl);

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
          Enter a topic or description to generate engaging content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., 'Tips for effective time management'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="scheduledDate">Schedule Date</Label>
            <Input
              type="date"
              id="scheduledDate"
              value={scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setScheduledDate(new Date(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scheduledTime">Schedule Time</Label>
            <Input
              type="time"
              id="scheduledTime"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleGenerateContent}
          disabled={isGenerating}
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
