import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, postId, mediaUrl, accountId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log(`[MASTODON-POST] Posting for user ${user.id}:`, message.substring(0, 50) + '...');

    // Get user's Mastodon account
    let mastodonAccount;
    if (accountId) {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .eq('platform', 'mastodon')
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        throw new Error('Mastodon account not found');
      }
      mastodonAccount = data;
    } else {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'mastodon')
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        throw new Error('No Mastodon account connected. Please connect your Mastodon account first.');
      }
      mastodonAccount = data;
    }

    // Get access token from vault
    const { data: tokenData, error: tokenError } = await supabase
      .from('social_tokens_vault')
      .select('encrypted_access_token, encrypted_refresh_token')
      .eq('social_account_id', mastodonAccount.id)
      .single();

    if (tokenError || !tokenData?.encrypted_access_token) {
      throw new Error('Mastodon access token not found. Please reconnect your account.');
    }

    const accessToken = tokenData.encrypted_access_token;
    // Instance URL is stored in encrypted_refresh_token field or account_data
    const instanceUrl = tokenData.encrypted_refresh_token || 
                        (mastodonAccount.account_data as any)?.instance_url;
    
    if (!instanceUrl) {
      throw new Error('Mastodon instance URL not found. Please reconnect your account.');
    }

    console.log(`[MASTODON-POST] Using account @${mastodonAccount.username} on ${instanceUrl}`);

    // Build form data for the status
    const formData = new FormData();
    formData.append('status', message);

    // If there's a media URL, upload it first
    let mediaId = null;
    if (mediaUrl) {
      console.log('[MASTODON-POST] Uploading media:', mediaUrl);
      
      // Fetch the image
      const imageResponse = await fetch(mediaUrl);
      const imageBlob = await imageResponse.blob();
      
      const mediaFormData = new FormData();
      mediaFormData.append('file', imageBlob, 'image.jpg');
      
      const mediaResponse = await fetch(`${instanceUrl}/api/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: mediaFormData,
      });

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error('[MASTODON-POST] Failed to upload media:', errorText);
      } else {
        const mediaData = await mediaResponse.json();
        mediaId = mediaData.id;
        console.log('[MASTODON-POST] Media uploaded successfully, ID:', mediaId);
      }
    }

    // Add media ID if we have one
    if (mediaId) {
      formData.append('media_ids[]', mediaId);
    }

    // Post the status
    const response = await fetch(`${instanceUrl}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MASTODON-POST] API error:', errorText);
      throw new Error(`Failed to post to Mastodon: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[MASTODON-POST] Posted successfully, status ID:', result.id);

    // Update post status if postId provided
    if (postId) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          status: 'published',
          posted_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', postId);

      if (updateError) {
        console.error('[MASTODON-POST] Failed to update post status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusId: result.id,
        url: result.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MASTODON-POST] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
