
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const usePostsManager = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

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
      queryClient.invalidateQueries({ queryKey: ['user-posts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-month-posts', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['user-posts', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['user-posts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-month-posts', user?.id] });
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

  return {
    posts,
    currentMonthPosts,
    isProUser,
    isStarterUser,
    createPostMutation,
    updatePostMutation,
    deletePostMutation,
    refetch
  };
};
