import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to determine if error is recoverable (should reschedule) or permanent (failed)
function isRecoverableError(error: string): boolean {
  const recoverablePatterns = [
    'network', 'timeout', 'rate limit', 'temporarily', 'try again',
    'ECONNREFUSED', 'ETIMEDOUT', 'service unavailable', '503', '429'
  ];
  
  const errorLower = error.toLowerCase();
  return recoverablePatterns.some(pattern => errorLower.includes(pattern));
}

// Post to Facebook Graph API directly
async function postToFacebook(pageId: string, accessToken: string, message: string, imageUrl?: string) {
  console.log('[FACEBOOK-POST] Posting to page:', pageId);
  
  try {
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/`;
    let body: any = { message, access_token: accessToken };

    if (imageUrl) {
      endpoint += 'photos';
      body.url = imageUrl;
    } else {
      endpoint += 'feed';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[FACEBOOK-POST] Success:', data);
    return data;
  } catch (error: any) {
    console.error('[FACEBOOK-POST] Error:', error);
    throw error;
  }
}

// Smart truncation function for natural breaks
function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const reservedForEllipsis = 3;
  const targetLength = maxLength - reservedForEllipsis;
  
  if (targetLength <= 0) return text.substring(0, maxLength);
  
  // First try: Find last complete sentence
  const sentenceEndPattern = /[.!?。！？]\s/g;
  let lastSentenceEnd = -1;
  let match;
  
  while ((match = sentenceEndPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastSentenceEnd = endPos;
    } else {
      break;
    }
  }
  
  if (lastSentenceEnd > targetLength * 0.4) {
    return text.substring(0, lastSentenceEnd).trim();
  }
  
  // Second try: Break at special characters or emojis
  const breakPointPattern = /[,;:\-–—|•·]\s|[\u{1F300}-\u{1F9FF}][\s]?/gu;
  let lastBreakPoint = -1;
  
  while ((match = breakPointPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastBreakPoint = endPos;
    } else {
      break;
    }
  }
  
  if (lastBreakPoint > targetLength * 0.5) {
    return text.substring(0, lastBreakPoint).trim() + '...';
  }
  
  // Third try: Break at last word boundary
  const truncated = text.substring(0, targetLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > targetLength * 0.6) {
    return text.substring(0, lastSpace).trim() + '...';
  }
  
  // Fallback: Hard cut
  return text.substring(0, targetLength).trim() + '...';
}

// Platform character limits
const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  mastodon: 500,
  telegram: 4096,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200
};

// Post to Mastodon instance with smart truncation
async function postToMastodon(instanceUrl: string, accessToken: string, message: string, imageUrl?: string) {
  console.log('[MASTODON-POST] Posting to instance:', instanceUrl);
  
  // Apply smart truncation for Mastodon's 500 char limit
  const truncatedMessage = smartTruncate(message, PLATFORM_LIMITS.mastodon);
  if (truncatedMessage.length !== message.length) {
    console.log(`[MASTODON-POST] Smart truncated from ${message.length} to ${truncatedMessage.length} chars`);
  }
  
  try {
    const formData = new FormData();
    formData.append('status', truncatedMessage);

    // Upload media if provided
    let mediaId = null;
    if (imageUrl) {
      console.log('[MASTODON-POST] Uploading media...');
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      const mediaFormData = new FormData();
      mediaFormData.append('file', imageBlob, 'image.jpg');
      
      const mediaResponse = await fetch(`${instanceUrl}/api/v2/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: mediaFormData,
      });

      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        mediaId = mediaData.id;
        console.log('[MASTODON-POST] Media uploaded, ID:', mediaId);
      }
    }

    if (mediaId) {
      formData.append('media_ids[]', mediaId);
    }

    const response = await fetch(`${instanceUrl}/api/v1/statuses`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mastodon API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[MASTODON-POST] Success, status ID:', data.id);
    return data;
  } catch (error: any) {
    console.error('[MASTODON-POST] Error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[PUBLISH-SCHEDULED-POSTS] Starting scheduled post check');

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    // Include seconds for proper comparison with database times
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 8); // HH:MM:SS

    console.log(`[PUBLISH-SCHEDULED-POSTS] Current UTC time: ${currentDate} ${currentTime}`);
    
    // First, log ALL scheduled/rescheduled posts to debug
    const { data: allScheduledPosts, error: debugError } = await supabaseClient
      .from('posts')
      .select('id, status, scheduled_date, scheduled_time, created_at')
      .in('status', ['scheduled', 'rescheduled']);
    
    if (!debugError && allScheduledPosts) {
      console.log(`[PUBLISH-SCHEDULED-POSTS] All scheduled/rescheduled posts in database:`, 
        allScheduledPosts.map(p => ({
          id: p.id,
          status: p.status,
          scheduled_date: p.scheduled_date,
          scheduled_time: p.scheduled_time,
          created_at: p.created_at
        }))
      );
    }

    // Query for scheduled AND rescheduled posts that are due
    const { data: scheduledPosts, error: queryError } = await supabaseClient
      .from('posts')
      .select('*')
      .in('status', ['scheduled', 'rescheduled'])
      .lte('scheduled_date', currentDate)
      .lte('scheduled_time', currentTime);

    if (queryError) {
      console.error('[PUBLISH-SCHEDULED-POSTS] Error querying posts:', queryError);
      throw queryError;
    }

    console.log(`[PUBLISH-SCHEDULED-POSTS] Found ${scheduledPosts?.length || 0} posts to process`);
    
    if (scheduledPosts && scheduledPosts.length > 0) {
      console.log(`[PUBLISH-SCHEDULED-POSTS] Posts ready to publish:`, 
        scheduledPosts.map(p => ({
          id: p.id,
          status: p.status,
          scheduled_date: p.scheduled_date,
          scheduled_time: p.scheduled_time
        }))
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to publish', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    let rescheduledCount = 0;

    // Process each post
    for (const post of scheduledPosts) {
      console.log(`[PUBLISH-SCHEDULED-POSTS] Processing post ${post.id}, status: ${post.status}`);

      try {
        // Get user's social accounts
        const { data: socialAccounts, error: accountsError } = await supabaseClient
          .from('social_accounts')
          .select('*')
          .eq('user_id', post.user_id)
          .eq('is_active', true);

        if (accountsError) {
          throw new Error(`Failed to fetch social accounts: ${accountsError.message}`);
        }

        if (!socialAccounts || socialAccounts.length === 0) {
          throw new Error('No active social accounts found. Please connect a social media account.');
        }

        // Get social platforms from post
        const targetPlatforms = post.social_platforms && post.social_platforms.length > 0
          ? post.social_platforms
          : ['facebook'];

        console.log(`[PUBLISH-SCHEDULED-POSTS] Target platforms:`, targetPlatforms);

        if (targetPlatforms.length === 0) {
          throw new Error('No social platforms selected. Please select at least one platform.');
        }

        // Publish to each selected platform
        const publishResults = [];
        for (const platform of targetPlatforms) {
          const account = socialAccounts.find(acc => acc.platform === platform);
          
          if (!account) {
            publishResults.push({ 
              platform, 
              success: false, 
              error: `No ${platform} account connected` 
            });
            continue;
          }

          try {
            if (platform === 'facebook') {
              // Get access token from vault
              const { data: tokenData, error: tokenError } = await supabaseClient
                .from('social_tokens_vault')
                .select('encrypted_access_token, token_expires_at')
                .eq('social_account_id', account.id)
                .single();

              if (tokenError || !tokenData?.encrypted_access_token) {
                console.error(`[PUBLISH-SCHEDULED-POSTS] Token fetch error for account ${account.id}:`, tokenError);
                throw new Error('Facebook access token not found. Please reconnect your Facebook account.');
              }

              // Check token expiration
              if (tokenData.token_expires_at) {
                const expiresAt = new Date(tokenData.token_expires_at);
                const now = new Date();
                if (expiresAt < now) {
                  console.error(`[PUBLISH-SCHEDULED-POSTS] Token expired at ${expiresAt.toISOString()}, current time: ${now.toISOString()}`);
                  throw new Error('Facebook access token has expired. Please reconnect your Facebook account to refresh the token.');
                }
              }

              // Get page ID from account_data
              const pageId = account.account_data?.id || account.platform_user_id;
              if (!pageId) {
                throw new Error('Facebook page ID not found');
              }

              // Post to Facebook
              const message = `${post.generated_caption}\n\n${post.generated_hashtags?.join(' ') || ''}`;
              await postToFacebook(pageId, tokenData.encrypted_access_token, message, post.media_url);
              
              publishResults.push({ platform: 'facebook', success: true });
              console.log(`[PUBLISH-SCHEDULED-POSTS] Successfully posted to Facebook`);
            } else if (platform === 'mastodon') {
              // Get access token from vault
              const { data: tokenData, error: tokenError } = await supabaseClient
                .from('social_tokens_vault')
                .select('encrypted_access_token, encrypted_refresh_token')
                .eq('social_account_id', account.id)
                .single();

              if (tokenError || !tokenData?.encrypted_access_token) {
                console.error(`[PUBLISH-SCHEDULED-POSTS] Token fetch error for Mastodon account ${account.id}:`, tokenError);
                throw new Error('Mastodon access token not found. Please reconnect your Mastodon account.');
              }

              // Instance URL is stored in encrypted_refresh_token or account_data
              const instanceUrl = tokenData.encrypted_refresh_token || 
                                  (account.account_data as any)?.instance_url;
              
              if (!instanceUrl) {
                throw new Error('Mastodon instance URL not found. Please reconnect your account.');
              }

              // Post to Mastodon
              const message = `${post.generated_caption}\n\n${post.generated_hashtags?.join(' ') || ''}`;
              await postToMastodon(instanceUrl, tokenData.encrypted_access_token, message, post.media_url);
              
              publishResults.push({ platform: 'mastodon', success: true });
              console.log(`[PUBLISH-SCHEDULED-POSTS] Successfully posted to Mastodon`);
            }
            // Add more platforms here
          } catch (platformError: any) {
            console.error(`[PUBLISH-SCHEDULED-POSTS] Error posting to ${platform}:`, platformError);
            publishResults.push({ 
              platform, 
              success: false, 
              error: platformError.message,
              recoverable: isRecoverableError(platformError.message)
            });
          }
        }

        // Determine final status
        const anySuccess = publishResults.some(r => r.success);
        const allFailed = publishResults.every(r => !r.success);
        const anyRecoverable = publishResults.some(r => !r.success && r.recoverable);

        if (anySuccess) {
          // At least one platform succeeded
          await supabaseClient
            .from('posts')
            .update({
              status: 'published',
              posted_at: now.toISOString(),
              error_message: null,
              updated_at: now.toISOString()
            })
            .eq('id', post.id);

          successCount++;
          console.log(`[PUBLISH-SCHEDULED-POSTS] Post ${post.id} marked as published`);
        } else if (allFailed && anyRecoverable) {
          // All failed but some are recoverable - reschedule for 5 minutes later
          const errorMessages = publishResults
            .filter(r => !r.success)
            .map(r => `${r.platform}: ${r.error}`)
            .join('; ');

          const newScheduledTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
          
          await supabaseClient
            .from('posts')
            .update({
              status: 'rescheduled',
              error_message: `Temporary failure, will retry. ${errorMessages}`,
              scheduled_date: newScheduledTime.toISOString().split('T')[0],
              scheduled_time: newScheduledTime.toTimeString().split(' ')[0].substring(0, 5),
              updated_at: now.toISOString()
            })
            .eq('id', post.id);

          rescheduledCount++;
          console.log(`[PUBLISH-SCHEDULED-POSTS] Post ${post.id} rescheduled to ${newScheduledTime.toISOString()}`);
        } else {
          // All failed with permanent errors
          const errorMessages = publishResults
            .filter(r => !r.success)
            .map(r => `${r.platform}: ${r.error}`)
            .join('; ');

          await supabaseClient
            .from('posts')
            .update({
              status: 'failed',
              error_message: errorMessages,
              updated_at: now.toISOString()
            })
            .eq('id', post.id);

          failureCount++;
          console.log(`[PUBLISH-SCHEDULED-POSTS] Post ${post.id} marked as failed: ${errorMessages}`);
        }

      } catch (postError: any) {
        console.error(`[PUBLISH-SCHEDULED-POSTS] Error processing post ${post.id}:`, postError);
        
        // Check if error is recoverable
        if (isRecoverableError(postError.message)) {
          const newScheduledTime = new Date(now.getTime() + 5 * 60000);
          
          await supabaseClient
            .from('posts')
            .update({
              status: 'rescheduled',
              error_message: `Temporary failure, will retry. ${postError.message}`,
              scheduled_date: newScheduledTime.toISOString().split('T')[0],
              scheduled_time: newScheduledTime.toTimeString().split(' ')[0].substring(0, 5),
              updated_at: now.toISOString()
            })
            .eq('id', post.id);
          
          rescheduledCount++;
        } else {
          await supabaseClient
            .from('posts')
            .update({
              status: 'failed',
              error_message: postError.message,
              updated_at: now.toISOString()
            })
            .eq('id', post.id);
          
          failureCount++;
        }
      }
    }

    const result = {
      message: 'Processing complete',
      total: scheduledPosts.length,
      successful: successCount,
      failed: failureCount,
      rescheduled: rescheduledCount
    };

    console.log('[PUBLISH-SCHEDULED-POSTS] Final result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PUBLISH-SCHEDULED-POSTS] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});