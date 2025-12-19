import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { message, imageUrl, accountId } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required for Instagram posts');
    }

    console.log('[INSTAGRAM-POST] Posting to Instagram for user:', user.id);

    // Get the social account
    const { data: account, error: accountError } = await supabaseClient
      .from('social_accounts')
      .select('platform_user_id, account_data')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single();

    if (accountError || !account) {
      throw new Error('Instagram account not found');
    }

    // Get access token from vault
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('social_tokens_vault')
      .select('encrypted_access_token, token_expires_at')
      .eq('social_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      console.error('[INSTAGRAM-POST] Token fetch error:', tokenError);
      throw new Error('Instagram access token not found. Please reconnect your Instagram account.');
    }

    // Check if token is expired
    if (tokenData.token_expires_at) {
      const expiresAt = new Date(tokenData.token_expires_at);
      const now = new Date();
      if (expiresAt < now) {
        throw new Error('Instagram access token has expired. Please reconnect your Instagram account.');
      }
    }

    const accessToken = tokenData.encrypted_access_token;
    const instagramAccountId = account.platform_user_id;

    console.log('[INSTAGRAM-POST] Posting to Instagram account:', instagramAccountId);

    // Step 1: Create a media container
    console.log('[INSTAGRAM-POST] Creating media container...');
    const containerResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message || '',
          access_token: accessToken
        })
      }
    );

    const containerResult = await containerResponse.json();

    if (!containerResponse.ok || containerResult.error) {
      console.error('[INSTAGRAM-POST] Container creation error:', containerResult);
      
      if (containerResult.error?.code === 190) {
        throw new Error('Instagram token expired. Please reconnect your Instagram account.');
      }
      
      throw new Error(containerResult.error?.message || 'Failed to create Instagram media container');
    }

    const creationId = containerResult.id;
    console.log('[INSTAGRAM-POST] Media container created:', creationId);

    // Step 2: Wait for media to be ready (poll status)
    let mediaReady = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!mediaReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v21.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusResult = await statusResponse.json();
      
      console.log('[INSTAGRAM-POST] Media status:', statusResult.status_code);
      
      if (statusResult.status_code === 'FINISHED') {
        mediaReady = true;
      } else if (statusResult.status_code === 'ERROR') {
        throw new Error('Failed to process Instagram media');
      }
      
      attempts++;
    }

    if (!mediaReady) {
      throw new Error('Media processing timeout. Please try again.');
    }

    // Step 3: Publish the media
    console.log('[INSTAGRAM-POST] Publishing media...');
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken
        })
      }
    );

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok || publishResult.error) {
      console.error('[INSTAGRAM-POST] Publish error:', publishResult);
      throw new Error(publishResult.error?.message || 'Failed to publish Instagram post');
    }

    console.log('[INSTAGRAM-POST] Successfully posted to Instagram:', publishResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: publishResult.id,
        message: 'Posted to Instagram successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[INSTAGRAM-POST] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
