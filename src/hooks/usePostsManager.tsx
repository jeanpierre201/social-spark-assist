
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

  // Determine user subscription status
  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const isFreeUser = !subscribed;

  // Fetch all posts for the current user
  const postsQuery = useQuery({
    queryKey: ['posts', user?.id, isFreeUser],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id);
      
      // For free users, only show posts from the last 24 hours
      if (isFreeUser) {
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        query = query.gte('created_at', oneDayAgo.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Separate query to count posts in the current 30-day period (for free users)
  // This ensures we count ALL posts, not just visible ones
  const postCountQuery = useQuery({
    queryKey: ['posts-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      // Count posts from the last 30 days for free users
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) {
        console.error('Error counting posts:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && isFreeUser,
  });

  // Get current month's posts count
  // For free users, use the dedicated count query (counts last 30 days)
  // For paid users, count from the fetched posts
  const currentMonthPosts = isFreeUser 
    ? (postCountQuery.data || 0)
    : (postsQuery.data?.filter(post => {
        const postDate = new Date(post.created_at || '');
        const now = new Date();
        return postDate.getMonth() === now.getMonth() && 
               postDate.getFullYear() === now.getFullYear();
      }).length || 0);

  // Determine post limit based on subscription
  const getPostLimit = () => {
    if (!subscribed) return 1; // Free users get 1 post per month
    if (subscriptionTier === 'Starter') return 10;
    if (subscriptionTier === 'Pro') return 100;
    return 1; // Default to 1 for any edge cases
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
      uploaded_image_url?: string;
      ai_generated_image_1_url?: string;
      ai_generated_image_2_url?: string;
      selected_image_type?: string;
      ai_generations_count?: number;
      ai_image_prompts?: string[];
      // added for branding/campaign support
      brand_id?: string | null;
      campaign_id?: string | null;
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
      industry,
      goal,
      niche_info,
      content, 
      hashtags,
      scheduled_date, 
      scheduled_time,
      uploaded_image_url,
      ai_generated_image_1_url,
      ai_generated_image_2_url,
      selected_image_type,
      ai_generations_count,
      ai_image_prompts,
      status,
      social_platforms,
      brand_id,
      campaign_id,
    }: { 
      id: string; 
      industry?: string;
      goal?: string;
      niche_info?: string;
      content: string; 
      hashtags?: string[];
      scheduled_date?: string; 
      scheduled_time?: string; 
      uploaded_image_url?: string;
      ai_generated_image_1_url?: string;
      ai_generated_image_2_url?: string;
      selected_image_type?: string;
      ai_generations_count?: number;
      ai_image_prompts?: string[];
      status?: string;
      social_platforms?: string[];
      brand_id?: string | null;
      campaign_id?: string | null;
    }) => {
      const updateData: any = {
        generated_caption: content,
        updated_at: new Date().toISOString()
      };

      if (industry !== undefined) updateData.industry = industry;
      if (goal !== undefined) updateData.goal = goal;
      if (niche_info !== undefined) updateData.niche_info = niche_info;
      if (hashtags !== undefined) updateData.generated_hashtags = hashtags;
      if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
      if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
      if (uploaded_image_url !== undefined) updateData.uploaded_image_url = uploaded_image_url;
      if (ai_generated_image_1_url !== undefined) updateData.ai_generated_image_1_url = ai_generated_image_1_url;
      if (ai_generated_image_2_url !== undefined) updateData.ai_generated_image_2_url = ai_generated_image_2_url;
      if (selected_image_type !== undefined) updateData.selected_image_type = selected_image_type;
      if (ai_generations_count !== undefined) updateData.ai_generations_count = ai_generations_count;
      if (ai_image_prompts !== undefined) updateData.ai_image_prompts = ai_image_prompts;
      if (status !== undefined) updateData.status = status;
      if (social_platforms !== undefined) updateData.social_platforms = social_platforms;
      if (brand_id !== undefined) updateData.brand_id = brand_id;
      if (campaign_id !== undefined) updateData.campaign_id = campaign_id;
      
      // Update media_url based on selected image type for backward compatibility
      if (selected_image_type !== undefined) {
        switch (selected_image_type) {
          case 'uploaded':
            updateData.media_url = uploaded_image_url;
            break;
          case 'ai_1':
            updateData.media_url = ai_generated_image_1_url;
            break;
          case 'ai_2':
            updateData.media_url = ai_generated_image_2_url;
            break;
          default:
            updateData.media_url = null;
        }
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
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
    isProUser,
    isStarterUser,
    isFreeUser,
  };
};
