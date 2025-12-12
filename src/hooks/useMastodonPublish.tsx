import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMastodonPublish = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const publishToMastodon = async (
    message: string,
    postId?: string,
    mediaUrl?: string
  ) => {
    setIsPublishing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('You must be logged in to post');
      }

      const { data, error } = await supabase.functions.invoke('mastodon-post', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          message,
          postId,
          mediaUrl,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to post to Mastodon');
      }

      if (data?.success) {
        toast({
          title: 'Posted to Mastodon',
          description: 'Your post has been published successfully!',
        });
        return { success: true, statusId: data.statusId, url: data.url };
      } else {
        throw new Error(data?.error || 'Failed to post to Mastodon');
      }
    } catch (error: any) {
      console.error('Mastodon publish error:', error);
      toast({
        title: 'Post Failed',
        description: error.message || 'Failed to post to Mastodon',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishToMastodon,
    isPublishing,
  };
};
