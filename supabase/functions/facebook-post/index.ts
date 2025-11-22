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
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Posting to Facebook for user:', user.id);

    // Get the social account
    const { data: account, error: accountError } = await supabaseClient
      .from('social_accounts')
      .select('platform_user_id, account_data')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .single();

    if (accountError || !account) {
      throw new Error('Facebook account not found');
    }

    // Get access token from vault - get the most recent one
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('social_tokens_vault')
      .select('encrypted_access_token, token_expires_at')
      .eq('social_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError);
      throw new Error('Facebook access token not found. Please reconnect your Facebook account.');
    }

    // Check if token is expired
    if (tokenData.token_expires_at) {
      const expiresAt = new Date(tokenData.token_expires_at);
      const now = new Date();
      if (expiresAt < now) {
        console.error('Token expired at:', expiresAt.toISOString(), 'Current time:', now.toISOString());
        throw new Error('Facebook access token has expired. Please reconnect your Facebook account to refresh the token.');
      }
      console.log('Token valid until:', expiresAt.toISOString());
    }

    const accessToken = tokenData.encrypted_access_token;
    const pageId = account.account_data?.page_id || account.platform_user_id;

    console.log('Posting to Facebook page:', pageId);

    // Prepare post data
    const postData: any = {
      message: message,
      access_token: accessToken
    };

    // Add image if provided
    if (imageUrl) {
      postData.url = imageUrl;
      postData.published = true;
    }

    // Post to Facebook - using latest API version
    const endpoint = imageUrl 
      ? `https://graph.facebook.com/v21.0/${pageId}/photos`
      : `https://graph.facebook.com/v21.0/${pageId}/feed`;

    console.log('Posting to endpoint:', endpoint);
    console.log('Post data (without token):', { message, imageUrl, pageId });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook API error response:', result);
      
      // Check for specific error codes
      if (result.error?.code === 190) {
        throw new Error('Facebook token expired. Please disconnect and reconnect Facebook on the Social page.');
      } else if (result.error?.code === 200) {
        throw new Error('Facebook permission denied. This requires: 1) Adding yourself as App Admin/Tester in Facebook App settings, OR 2) Submitting app for Facebook App Review. Then disconnect and reconnect on the Social page.');
      }
      
      throw new Error(result.error?.message || 'Failed to post to Facebook');
    }

    console.log('Successfully posted to Facebook:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: result.id || result.post_id,
        message: 'Posted to Facebook successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in facebook-post:', error);
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