
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

export const usePostsManager = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all posts for the current user
  const postsQuery = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Get current month's posts count
  const currentMonthPosts = postsQuery.data?.filter(post => {
    const postDate = new Date(post.created_at || '');
    const now = new Date();
    return postDate.getMonth() === now.getMonth() && 
           postDate.getFullYear() === now.getFullYear();
  }).length || 0;

  // Determine post limit based on subscription
  const getPostLimit = () => {
    if (!subscribed) return 0;
    if (subscriptionTier === 'Starter') return 10;
    if (subscriptionTier === 'Pro') return 100;
    return 0;
  };

  const postLimit = getPostLimit();

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (newPost: {
      industry: string;
      goal: string;
      niche_info?: string;
      generated_caption: string;
      generated_hashtags: string[];
      scheduled_date?: string;
      scheduled_time?: string;
      media_url?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check post limit for current month
      if (currentMonthPosts >= postLimit) {
        throw new Error(`Monthly post limit of ${postLimit} reached. Upgrade your plan for more posts.`);
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...newPost,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Created",
        description: "Your post has been generated and saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
      console.error('Create post error:', error);
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ 
      id, 
      content, 
      scheduled_date, 
      scheduled_time 
    }: { 
      id: string; 
      content: string; 
      scheduled_date?: string; 
      scheduled_time?: string; 
    }) => {
      const { error } = await supabase
        .from('posts')
        .update({ 
          generated_caption: content,
          scheduled_date,
          scheduled_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
      console.error('Update post error:', error);
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
      console.error('Delete post error:', error);
    },
  });

  return {
    posts: postsQuery.data || [],
    currentMonthPosts,
    postLimit,
    postsLoading: postsQuery.isLoading,
    createPostMutation,
    updatePostMutation,
    deletePostMutation,
    canCreatePost: currentMonthPosts < postLimit,
  };
};
