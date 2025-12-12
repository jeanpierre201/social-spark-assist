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

  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Initialize OAuth - register app with user's instance and get auth URL
    if (pathname.endsWith('/mastodon-oauth')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) throw new Error('Invalid authentication token');

      const body = await req.json();
      const instanceUrl = body.instanceUrl?.trim();
      const frontendOrigin = body.frontendOrigin || 'https://rombipost.lovable.app';

      if (!instanceUrl) {
        throw new Error('Mastodon instance URL is required');
      }

      // Normalize instance URL
      let normalizedInstance = instanceUrl;
      if (!normalizedInstance.startsWith('http')) {
        normalizedInstance = `https://${normalizedInstance}`;
      }
      normalizedInstance = normalizedInstance.replace(/\/$/, ''); // Remove trailing slash

      console.log('[MASTODON-OAUTH] Starting OAuth for user:', user.id, 'instance:', normalizedInstance);

      // Register the app with the Mastodon instance (if not already registered)
      const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mastodon-oauth/callback`;
      
      const appResponse = await fetch(`${normalizedInstance}/api/v1/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'RombiPost',
          redirect_uris: callbackUrl,
          scopes: 'read write',
          website: frontendOrigin
        })
      });

      if (!appResponse.ok) {
        const errorText = await appResponse.text();
        console.error('[MASTODON-OAUTH] App registration failed:', errorText);
        throw new Error(`Failed to register app with ${normalizedInstance}. Please check the instance URL.`);
      }

      const appData = await appResponse.json();
      console.log('[MASTODON-OAUTH] App registered, client_id:', appData.client_id);

      // Store temporary OAuth data
      const stateToken = crypto.randomUUID();
      
      await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'mastodon_temp',
          platform_user_id: stateToken,
          username: normalizedInstance, // Store instance URL
          account_data: {
            client_id: appData.client_id,
            client_secret: appData.client_secret,
            frontendOrigin,
            instanceUrl: normalizedInstance
          },
          is_active: false
        });

      // Build authorization URL
      const authUrl = `${normalizedInstance}/oauth/authorize?` + new URLSearchParams({
        client_id: appData.client_id,
        scope: 'read write',
        redirect_uri: callbackUrl,
        response_type: 'code',
        state: stateToken
      }).toString();

      return new Response(
        JSON.stringify({ authUrl }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 2: Handle callback from Mastodon
    if (pathname.endsWith('/callback')) {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error(`Mastodon authorization failed: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing OAuth parameters');
      }

      console.log('[MASTODON-OAUTH] Processing callback with state:', state);

      // Retrieve the stored OAuth data
      const { data: tempAccount, error: fetchError } = await supabaseClient
        .from('social_accounts')
        .select('*')
        .eq('platform', 'mastodon_temp')
        .eq('platform_user_id', state)
        .maybeSingle();

      if (fetchError || !tempAccount) {
        throw new Error('OAuth session not found or expired');
      }

      const accountData = tempAccount.account_data as any;
      const instanceUrl = accountData.instanceUrl;
      const clientId = accountData.client_id;
      const clientSecret = accountData.client_secret;
      const frontendOrigin = accountData.frontendOrigin || 'https://rombipost.lovable.app';
      const userId = tempAccount.user_id;
      const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mastodon-oauth/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch(`${instanceUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
          code: code,
          scope: 'read write'
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[MASTODON-OAUTH] Token exchange failed:', errorText);
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();
      console.log('[MASTODON-OAUTH] Got access token');

      // Get user account info
      const accountResponse = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to verify account');
      }

      const mastodonAccount = await accountResponse.json();
      console.log('[MASTODON-OAUTH] Verified account:', mastodonAccount.username);

      // Check if account already exists
      const { data: existingAccount } = await supabaseClient
        .from('social_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', 'mastodon')
        .eq('platform_user_id', mastodonAccount.id)
        .maybeSingle();

      let accountId: string;

      if (existingAccount) {
        // Update existing account
        await supabaseClient
          .from('social_accounts')
          .update({
            username: mastodonAccount.username,
            is_active: true,
            account_data: {
              instance_url: instanceUrl,
              display_name: mastodonAccount.display_name,
              avatar: mastodonAccount.avatar,
              followers_count: mastodonAccount.followers_count,
              following_count: mastodonAccount.following_count
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);

        // Delete old tokens and insert new ones
        await supabaseClient
          .from('social_tokens_vault')
          .delete()
          .eq('social_account_id', existingAccount.id);

        accountId = existingAccount.id;
      } else {
        // Create new social account
        const { data: newAccount, error: insertError } = await supabaseClient
          .from('social_accounts')
          .insert({
            user_id: userId,
            platform: 'mastodon',
            platform_user_id: mastodonAccount.id,
            username: mastodonAccount.username,
            is_active: true,
            account_data: {
              instance_url: instanceUrl,
              display_name: mastodonAccount.display_name,
              avatar: mastodonAccount.avatar,
              followers_count: mastodonAccount.followers_count,
              following_count: mastodonAccount.following_count
            }
          })
          .select()
          .single();

        if (insertError) throw insertError;
        accountId = newAccount.id;
      }

      // Store tokens in vault
      await supabaseClient
        .from('social_tokens_vault')
        .insert({
          social_account_id: accountId,
          encrypted_access_token: tokenData.access_token,
          encrypted_refresh_token: instanceUrl // Store instance URL for posting
        });

      // Delete temporary record
      await supabaseClient
        .from('social_accounts')
        .delete()
        .eq('platform', 'mastodon_temp')
        .eq('platform_user_id', state);

      // Redirect to frontend callback page
      const redirectUrl = `${frontendOrigin}/auth/mastodon/callback?success=true&username=${encodeURIComponent(mastodonAccount.username)}`;
      
      console.log('[MASTODON-OAUTH] Redirecting to frontend:', redirectUrl);
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders
        }
      });
    }

    throw new Error('Invalid endpoint');

  } catch (error: any) {
    console.error('[MASTODON-OAUTH] Error:', error);
    
    // If this is a callback error, redirect to frontend error page
    if (pathname.endsWith('/callback')) {
      const state = url.searchParams.get('state');
      let frontendOrigin = 'https://rombipost.lovable.app';
      
      if (state) {
        try {
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );
          
          const { data: tempAccount } = await supabaseClient
            .from('social_accounts')
            .select('account_data')
            .eq('platform', 'mastodon_temp')
            .eq('platform_user_id', state)
            .maybeSingle();
          
          if (tempAccount?.account_data) {
            frontendOrigin = (tempAccount.account_data as any)?.frontendOrigin || frontendOrigin;
          }
        } catch {
          // Use default
        }
      }
      
      const errorMsg = encodeURIComponent(error.message || 'OAuth failed');
      const redirectUrl = `${frontendOrigin}/auth/mastodon/callback?success=false&error=${errorMsg}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders
        }
      });
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'OAuth failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
