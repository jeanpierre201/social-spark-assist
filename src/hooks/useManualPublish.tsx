import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublishError {
  message: string;
  code?: string;
  tip?: string;
}

const parseErrorResponse = (error: any): PublishError => {
  // Try to extract structured error from response
  if (error?.message) {
    try {
      // Check if error message contains JSON
      const jsonMatch = error.message.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.error || parsed.message || error.message,
          code: parsed.code,
          tip: parsed.tip
        };
      }
    } catch {
      // Not JSON, use as-is
    }
    return { message: error.message };
  }
  return { message: 'Unknown error occurred' };
};

export const useManualPublish = () => {
  const [publishingPosts, setPublishingPosts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const publishToFacebook = async (postId: string, accountId: string, message: string, imageUrl?: string) => {
    setPublishingPosts(prev => new Set(prev).add(postId));

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
        console.error('[MANUAL-PUBLISH] Facebook error:', error);
        throw error;
      }

      // Check for error in response data
      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[MANUAL-PUBLISH] Facebook success:', data);

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
      }

      toast({
        title: 'Success',
        description: 'Post published to Facebook successfully!',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[MANUAL-PUBLISH] Facebook failed:', error);
      
      const parsedError = parseErrorResponse(error);
      const errorMessage = parsedError.tip 
        ? `${parsedError.message}. ${parsedError.tip}`
        : parsedError.message;

      // Update post with detailed error message
      await supabase
        .from('posts')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', postId);

      toast({
        title: 'Facebook Post Failed',
        description: parsedError.message,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setPublishingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const publishToTwitter = async (postId: string, accountId: string, message: string) => {
    setPublishingPosts(prev => new Set(prev).add(postId));

    try {
      console.log('[MANUAL-PUBLISH] Publishing to Twitter:', { postId, accountId });

      const { data, error } = await supabase.functions.invoke('twitter-post', {
        body: { 
          accountId,
          message 
        }
      });

      if (error) {
        console.error('[MANUAL-PUBLISH] Twitter invoke error:', error);
        throw error;
      }

      // Check for error in response data (edge function returns error in body)
      if (data?.error) {
        const errorObj = {
          message: data.error,
          code: data.code,
          tip: data.tip
        };
        throw errorObj;
      }

      console.log('[MANUAL-PUBLISH] Twitter success:', data);

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
      }

      toast({
        title: 'Success',
        description: 'Tweet posted successfully!',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[MANUAL-PUBLISH] Twitter failed:', error);
      
      // Build detailed error message
      let errorMessage = error.message || 'Failed to post tweet';
      let toastDescription = errorMessage;
      
      // If we have a tip, include it in the stored error
      if (error.tip) {
        errorMessage = `${error.message}. ${error.tip}`;
        toastDescription = error.message; // Keep toast shorter
      }

      // Update post with detailed error message
      await supabase
        .from('posts')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', postId);

      toast({
        title: 'Twitter Post Failed',
        description: toastDescription,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setPublishingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const isPublishingPost = (postId: string) => publishingPosts.has(postId);

  return {
    publishToFacebook,
    publishToTwitter,
    isPublishingPost
  };
};
