import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublishError {
  message: string;
  code?: string;
  tip?: string;
}

export interface PlatformResult {
  status: 'pending' | 'success' | 'failed';
  published_at?: string;
  post_id?: string;
  error?: string;
  attempted_at?: string;
}

export type PlatformResults = Record<string, PlatformResult>;

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

// Calculate overall post status based on platform results
const calculateOverallStatus = (
  targetPlatforms: string[],
  platformResults: PlatformResults
): 'published' | 'partially_published' | 'failed' | 'scheduled' => {
  if (targetPlatforms.length === 0) return 'scheduled';
  
  // Normalize platform names for lookup
  const normalizedPlatforms = targetPlatforms.map(p => p.toLowerCase());
  
  const results = normalizedPlatforms.map(p => {
    // Check both original and normalized names
    const result = platformResults[p] || platformResults[p.toLowerCase()];
    return result?.status;
  });
  
  // Filter only platforms that have been attempted
  const attemptedResults = results.filter(r => r === 'success' || r === 'failed');
  
  if (attemptedResults.length === 0) return 'scheduled'; // No attempts yet
  
  const successCount = attemptedResults.filter(r => r === 'success').length;
  const failedCount = attemptedResults.filter(r => r === 'failed').length;
  
  // If all target platforms have been attempted
  if (attemptedResults.length === normalizedPlatforms.length) {
    if (successCount === normalizedPlatforms.length) return 'published';
    if (failedCount === normalizedPlatforms.length) return 'failed';
    return 'partially_published';
  }
  
  // Some platforms still pending
  if (successCount > 0 && failedCount > 0) return 'partially_published';
  if (successCount > 0) return 'partially_published';
  
  return 'failed';
};

export const useManualPublish = () => {
  const [publishingPosts, setPublishingPosts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Helper to get current post data including platform_results
  const getCurrentPostData = async (postId: string) => {
    const { data } = await supabase
      .from('posts')
      .select('social_platforms, platform_results')
      .eq('id', postId)
      .single();
    
    return {
      socialPlatforms: Array.isArray(data?.social_platforms) ? data.social_platforms as string[] : [],
      platformResults: (data?.platform_results as unknown as PlatformResults) || {}
    };
  };

  // Helper to update platform result and overall status
  const updatePlatformResult = async (
    postId: string,
    platform: string,
    result: PlatformResult,
    currentData: { socialPlatforms: string[], platformResults: PlatformResults }
  ) => {
    const normalizedPlatform = platform.toLowerCase();
    const updatedResults = {
      ...currentData.platformResults,
      [normalizedPlatform]: result
    };
    
    // Merge platform into social_platforms if successful
    let mergedPlatforms = currentData.socialPlatforms;
    if (result.status === 'success') {
      mergedPlatforms = [...new Set([...currentData.socialPlatforms, normalizedPlatform])];
    }
    
    // Calculate overall status
    const overallStatus = calculateOverallStatus(mergedPlatforms, updatedResults);
    
    const updateData: Record<string, any> = {
      platform_results: updatedResults,
      status: overallStatus,
      social_platforms: mergedPlatforms
    };
    
    // Set posted_at only when fully published
    if (overallStatus === 'published') {
      updateData.posted_at = new Date().toISOString();
      updateData.error_message = null;
    } else if (overallStatus === 'partially_published') {
      // Clear error_message since at least some succeeded
      updateData.error_message = null;
    } else if (overallStatus === 'failed' && result.error) {
      updateData.error_message = result.error;
    }
    
    await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);
    
    return { updatedResults, overallStatus };
  };

  const publishToMastodon = async (postId: string, message: string, imageUrl?: string) => {
    setPublishingPosts(prev => new Set(prev).add(postId));

    try {
      console.log('[MANUAL-PUBLISH] Publishing to Mastodon:', { postId });

      const { data, error } = await supabase.functions.invoke('mastodon-post', {
        body: {
          message,
          postId,
          mediaUrl: imageUrl
        }
      });

      if (error) {
        console.error('[MANUAL-PUBLISH] Mastodon error:', error);
        throw error;
      }

      // Check for error in response data
      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[MANUAL-PUBLISH] Mastodon success:', data);

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result
      await updatePlatformResult(postId, 'mastodon', {
        status: 'success',
        published_at: new Date().toISOString(),
        post_id: data?.id || data?.postId
      }, currentData);

      toast({
        title: 'Success',
        description: 'Post published to Mastodon successfully!',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[MANUAL-PUBLISH] Mastodon failed:', error);
      
      const parsedError = parseErrorResponse(error);
      const errorMessage = parsedError.tip 
        ? `${parsedError.message}. ${parsedError.tip}`
        : parsedError.message;

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result with failure
      await updatePlatformResult(postId, 'mastodon', {
        status: 'failed',
        error: errorMessage,
        attempted_at: new Date().toISOString()
      }, currentData);

      toast({
        title: 'Mastodon Post Failed',
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

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result
      await updatePlatformResult(postId, 'facebook', {
        status: 'success',
        published_at: new Date().toISOString(),
        post_id: data?.id || data?.postId
      }, currentData);

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

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result with failure
      await updatePlatformResult(postId, 'facebook', {
        status: 'failed',
        error: errorMessage,
        attempted_at: new Date().toISOString()
      }, currentData);

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

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result - include both 'twitter' and 'x' in social_platforms
      const updatedResults = {
        ...currentData.platformResults,
        twitter: {
          status: 'success' as const,
          published_at: new Date().toISOString(),
          post_id: data?.id || data?.postId
        },
        x: {
          status: 'success' as const,
          published_at: new Date().toISOString(),
          post_id: data?.id || data?.postId
        }
      };
      
      const mergedPlatforms = [...new Set([...currentData.socialPlatforms, 'twitter', 'x'])];
      const overallStatus = calculateOverallStatus(mergedPlatforms, updatedResults);
      
      const updateData: Record<string, any> = {
        platform_results: updatedResults,
        status: overallStatus,
        social_platforms: mergedPlatforms
      };
      
      if (overallStatus === 'published') {
        updateData.posted_at = new Date().toISOString();
        updateData.error_message = null;
      } else if (overallStatus === 'partially_published') {
        updateData.error_message = null;
      }
      
      await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

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

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result with failure for both twitter and x
      const updatedResults = {
        ...currentData.platformResults,
        twitter: {
          status: 'failed' as const,
          error: errorMessage,
          attempted_at: new Date().toISOString()
        },
        x: {
          status: 'failed' as const,
          error: errorMessage,
          attempted_at: new Date().toISOString()
        }
      };
      
      const overallStatus = calculateOverallStatus(currentData.socialPlatforms, updatedResults);
      
      await supabase
        .from('posts')
        .update({ 
          platform_results: updatedResults,
          status: overallStatus,
          error_message: overallStatus === 'failed' ? errorMessage : null
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

  const publishToTelegram = async (postId: string, message: string, imageUrl?: string) => {
    setPublishingPosts(prev => new Set(prev).add(postId));

    try {
      console.log('[MANUAL-PUBLISH] Publishing to Telegram:', { postId });

      const { data, error } = await supabase.functions.invoke('telegram-post', {
        body: {
          message,
          postId,
          mediaUrl: imageUrl
        }
      });

      if (error) {
        console.error('[MANUAL-PUBLISH] Telegram error:', error);
        throw error;
      }

      // Check for error in response data
      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[MANUAL-PUBLISH] Telegram success:', data);

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result
      await updatePlatformResult(postId, 'telegram', {
        status: 'success',
        published_at: new Date().toISOString(),
        post_id: data?.message_id?.toString()
      }, currentData);

      toast({
        title: 'Success',
        description: 'Post published to Telegram successfully!',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[MANUAL-PUBLISH] Telegram failed:', error);
      
      const parsedError = parseErrorResponse(error);
      const errorMessage = parsedError.tip 
        ? `${parsedError.message}. ${parsedError.tip}`
        : parsedError.message;

      // Get current post data
      const currentData = await getCurrentPostData(postId);
      
      // Update platform result with failure
      await updatePlatformResult(postId, 'telegram', {
        status: 'failed',
        error: errorMessage,
        attempted_at: new Date().toISOString()
      }, currentData);

      toast({
        title: 'Telegram Post Failed',
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

  const isPublishingPost = (postId: string) => publishingPosts.has(postId);

  return {
    publishToMastodon,
    publishToFacebook,
    publishToTwitter,
    publishToTelegram,
    isPublishingPost
  };
};
