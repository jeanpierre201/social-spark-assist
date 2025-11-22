import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useManualPublish = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const publishToFacebook = async (postId: string, accountId: string, message: string, imageUrl?: string) => {
    setIsPublishing(true);

    try {
      console.log('[MANUAL-PUBLISH] Publishing to Facebook:', { postId, accountId });

      const { data, error } = await supabase.functions.invoke('facebook-post', {
        body: {
          accountId,
          message,
          imageUrl
        }
      });

      if (error) {
        console.error('[MANUAL-PUBLISH] Error:', error);
        throw error;
      }

      console.log('[MANUAL-PUBLISH] Success:', data);

      // Update post status to published
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          posted_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', postId);

      if (updateError) {
        console.error('[MANUAL-PUBLISH] Failed to update post status:', updateError);
        // Still show success since the post was published
      }

      toast({
        title: 'Success',
        description: 'Post published to Facebook successfully!',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[MANUAL-PUBLISH] Failed:', error);
      
      // Update post with error message but keep it editable
      await supabase
        .from('posts')
        .update({ 
          status: 'failed',
          error_message: error.message || 'Failed to publish'
        })
        .eq('id', postId);

      toast({
        title: 'Post Failed',
        description: error.message || 'Failed to publish to Facebook',
        variant: 'destructive',
      });

      return { success: false, error: error.message };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishToFacebook,
    isPublishing
  };
};
