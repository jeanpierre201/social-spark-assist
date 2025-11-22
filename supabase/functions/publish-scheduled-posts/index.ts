import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get current UTC time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log(`[PUBLISH-SCHEDULED-POSTS] Current UTC time: ${currentDate} ${currentTime}`);

    // Query for posts that should be published now
    // Posts are stored with user_timezone, so we need to convert to UTC for comparison
    const { data: scheduledPosts, error: queryError } = await supabaseClient
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', currentDate)
      .lte('scheduled_time', currentTime);

    if (queryError) {
      console.error('[PUBLISH-SCHEDULED-POSTS] Error querying posts:', queryError);
      throw queryError;
    }

    console.log(`[PUBLISH-SCHEDULED-POSTS] Found ${scheduledPosts?.length || 0} posts to process`);

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to publish', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each post
    for (const post of scheduledPosts) {
      console.log(`[PUBLISH-SCHEDULED-POSTS] Processing post ${post.id}`);

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
          throw new Error('No active social accounts found');
        }

        // Get social platforms from post (default to all if not specified)
        const targetPlatforms = post.social_platforms && post.social_platforms.length > 0
          ? post.social_platforms
          : ['facebook']; // Default to Facebook for now

        console.log(`[PUBLISH-SCHEDULED-POSTS] Target platforms:`, targetPlatforms);

        // Publish to each selected platform
        const publishResults = [];
        for (const platform of targetPlatforms) {
          const account = socialAccounts.find(acc => acc.platform === platform);
          
          if (!account) {
            console.log(`[PUBLISH-SCHEDULED-POSTS] No account found for platform: ${platform}`);
            continue;
          }

          try {
            if (platform === 'facebook') {
              // Call facebook-post edge function
              const { data: fbResult, error: fbError } = await supabaseClient.functions.invoke(
                'facebook-post',
                {
                  body: {
                    message: `${post.generated_caption}\n\n${post.generated_hashtags.join(' ')}`,
                    imageUrl: post.media_url,
                    accountId: account.id
                  }
                }
              );

              if (fbError) throw fbError;
              publishResults.push({ platform: 'facebook', success: true, data: fbResult });
              console.log(`[PUBLISH-SCHEDULED-POSTS] Successfully posted to Facebook`);
            }
            // Add more platforms here (Instagram, Twitter, etc.)
          } catch (platformError: any) {
            console.error(`[PUBLISH-SCHEDULED-POSTS] Error posting to ${platform}:`, platformError);
            publishResults.push({ 
              platform, 
              success: false, 
              error: platformError.message 
            });
          }
        }

        // Check if any publish was successful
        const anySuccess = publishResults.some(r => r.success);
        const allFailed = publishResults.length > 0 && publishResults.every(r => !r.success);

        if (anySuccess) {
          // Update post status to published
          const { error: updateError } = await supabaseClient
            .from('posts')
            .update({
              status: 'published',
              posted_at: now.toISOString(),
              error_message: null,
              updated_at: now.toISOString()
            })
            .eq('id', post.id);

          if (updateError) {
            console.error('[PUBLISH-SCHEDULED-POSTS] Error updating post status:', updateError);
          } else {
            successCount++;
            console.log(`[PUBLISH-SCHEDULED-POSTS] Post ${post.id} marked as published`);
          }
        } else if (allFailed) {
          // All platforms failed - mark as failed
          const errorMessages = publishResults.map(r => `${r.platform}: ${r.error}`).join('; ');
          const { error: updateError } = await supabaseClient
            .from('posts')
            .update({
              status: 'failed',
              error_message: errorMessages,
              updated_at: now.toISOString()
            })
            .eq('id', post.id);

          if (updateError) {
            console.error('[PUBLISH-SCHEDULED-POSTS] Error marking post as failed:', updateError);
          }
          failureCount++;
          console.log(`[PUBLISH-SCHEDULED-POSTS] Post ${post.id} marked as failed: ${errorMessages}`);
        }

      } catch (postError: any) {
        console.error(`[PUBLISH-SCHEDULED-POSTS] Error processing post ${post.id}:`, postError);
        
        // Mark post as failed
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

    const result = {
      message: 'Processing complete',
      total: scheduledPosts.length,
      successful: successCount,
      failed: failureCount
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