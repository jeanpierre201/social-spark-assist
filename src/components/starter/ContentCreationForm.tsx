
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
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
}

const ContentCreationForm = ({ monthlyPosts, setMonthlyPosts, canCreatePosts, setPosts }: ContentCreationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [nicheInfo, setNicheInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateWithImages, setGenerateWithImages] = useState(false);

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

      const generatedContent: GeneratedContent = {
        caption: data.caption,
        hashtags: data.hashtags
      };

      // Generate image if requested
      if (generateWithImages) {
        // TODO: Add image generation call here
        toast({
          title: "Image Generation",
          description: "Image generation will be implemented in the next update",
        });
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          industry: industry.trim(),
          goal: goal.trim(),
          niche_info: nicheInfo.trim() || null,
          generated_caption: generatedContent.caption,
          generated_hashtags: generatedContent.hashtags
        });

      if (dbError) throw dbError;

      const newPost: PostData = {
        industry: industry.trim(),
        goal: goal.trim(),
        nicheInfo: nicheInfo.trim(),
        generatedContent
      };

      setPosts(prev => [...prev, newPost]);
      setMonthlyPosts(prev => prev + 1);

      // Clear form
      setIndustry('');
      setGoal('');
      setNicheInfo('');

      toast({
        title: "Content Generated!",
        description: "Your post has been generated and added to your collection",
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

        // Save to database
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
          generatedContent
        };

        setPosts(prev => [...prev, newPost]);
        setMonthlyPosts(prev => prev + 1);
      }

      // Clear form
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 text-purple-600 mr-2" />
          Create Content
        </CardTitle>
        <CardDescription>
          Generate single posts or batch create content
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
          <input
            type="checkbox"
            id="generate-images"
            checked={generateWithImages}
            onChange={(e) => setGenerateWithImages(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="generate-images" className="text-sm">
            Generate AI images (Coming soon)
          </Label>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleGenerateSingle}
            disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
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
                Generate Single Post
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateAll10}
            disabled={isGenerating || monthlyPosts >= 10 || !industry.trim() || !goal.trim() || !canCreatePosts}
            variant="outline"
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Remaining Posts ({10 - monthlyPosts} left)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCreationForm;
