import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Calendar,
  Clock,
  Copy,
  Download,
  Edit2,
  Trash2,
  Crown,
  Zap,
  Image as ImageIcon,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import UsageIndicators from './starter/UsageIndicators';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';
import SocialMediaSettings from './SocialMediaSettings';

const ContentGenerator = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { accounts } = useSocialAccounts();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's posts
  const { data: initialPosts = [], refetch } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Fetch current month's posts count
  const { data: currentMonthPosts = 0 } = useQuery({
    queryKey: ['current-month-posts', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Mutation to create a new post
  const createPostMutation = useMutation({
    mutationFn: async (newPost: any) => {
      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-posts', user?.id]);
      queryClient.invalidateQueries(['current-month-posts', user?.id]);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Oh no! Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing post
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; content: string; scheduled_date: string | null; scheduled_time: string | null }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
  
      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-posts', user?.id]);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Oh no! Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a post
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-posts', user?.id]);
      queryClient.invalidateQueries(['current-month-posts', user?.id]);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Oh no! Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

      createPostMutation.mutate(newPost);
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

  const handleEditPost = (post: any) => {
    setPrompt(post.content);
    setSelectedPlatform(post.platform);
    setScheduledDate(post.scheduled_date ? new Date(post.scheduled_date) : null);
    setScheduledTime(post.scheduled_time || '');
  };

  const handleUpdatePost = async (post: any, newContent: string) => {
    updatePostMutation.mutate({ 
      id: post.id, 
      content: newContent,
      scheduled_date: post.scheduled_date,
      scheduled_time: post.scheduled_time
    });
  };

  const handleDeletePost = async (id: string) => {
    deletePostMutation.mutate(id);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Post copied to clipboard!",
    });
  };

  const handleDownloadPost = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "social-post.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isProUser ? 'Pro Content Generator' : isStarterUser ? 'Starter Content Generator' : 'Content Generator'}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Create engaging social media content with AI
                {isProUser && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1 text-purple-600" />
                    Pro Plan
                  </Badge>
                )}
                {isStarterUser && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Zap className="h-3 w-3 mr-1 text-blue-600" />
                    Starter Plan
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Pro Users */}
        {isProUser && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Content Generator
                </button>
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    navigate('/dashboard');
                  }}
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Advanced Analytics
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Team Collaboration
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'social'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Social Accounts
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content for Pro Users */}
        {isProUser && activeTab === 'analytics' && <ProAnalytics />}
        {isProUser && activeTab === 'team' && <TeamCollaboration />}
        {isProUser && activeTab === 'social' && <SocialMediaSettings />}
        
        {/* Content Generator Tab or Default View */}
        {(!isProUser || activeTab === 'content') && (
          <>
            {/* Usage Indicators */}
            <UsageIndicators 
              currentPosts={currentMonthPosts} 
              maxPosts={isProUser ? 100 : isStarterUser ? 10 : 0}
              subscriptionTier={subscriptionTier}
              subscribed={subscribed}
            />

            {/* Content Generation Form */}
            <div className="mb-6">
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
            </div>

            {/* Display Generated Posts */}
            <div data-posts-section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Your Posts</h2>
              {posts.length === 0 ? (
                <p className="text-muted-foreground">No posts generated yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(post.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadPost(post.content)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Created on {format(new Date(post.created_at), 'MMM dd, yyyy')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p>{post.content}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="Post" className="max-h-48 w-full object-cover rounded-md mt-2" />
                        )}
                        {post.scheduled_date && post.scheduled_time && (
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline-block h-4 w-4 mr-1" />
                            Scheduled:{' '}
                            {format(new Date(post.scheduled_date), 'MMM dd, yyyy')}{' '}
                            <Clock className="inline-block h-4 w-4 mr-1" />
                            {format(new Date(`2000-01-01T${post.scheduled_time}`), 'h:mm a')}
                          </p>
                        )}
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdatePost(post, prompt)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
