import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWITTER_CONSUMER_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const TWITTER_CONSUMER_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const CALLBACK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twitter-oauth/callback`;

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ""
): string {
  // Sort and encode params for signature base string
  const paramString = Object.entries(params)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  console.log('[TWITTER-OAUTH] Signature base string:', signatureBaseString);
  
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(
  method: string,
  url: string,
  additionalParams: Record<string, string> = {},
  tokenSecret: string = ""
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_CONSUMER_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...additionalParams,
  };

  const signature = generateOAuthSignature(method, url, oauthParams, TWITTER_CONSUMER_SECRET!, tokenSecret);
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };
  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));
  
  return "OAuth " + entries.map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

async function getRequestToken(): Promise<{ oauth_token: string; oauth_token_secret: string }> {
  const url = "https://api.x.com/oauth/request_token";
  const method = "POST";
  // Don't pre-encode oauth_callback - the signature generation handles encoding
  const oauthHeader = generateOAuthHeader(method, url, { oauth_callback: CALLBACK_URL });

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to get request token: ${responseText}`);
  }

  const params = new URLSearchParams(responseText);
  return {
    oauth_token: params.get("oauth_token")!,
    oauth_token_secret: params.get("oauth_token_secret")!,
  };
}

async function getAccessToken(
  oauthToken: string,
  oauthVerifier: string,
  oauthTokenSecret: string
): Promise<{ access_token: string; access_token_secret: string; user_id: string; screen_name: string }> {
  const url = "https://api.x.com/oauth/access_token";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(
    method,
    url,
    { oauth_token: oauthToken },
    oauthTokenSecret
  );

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `oauth_verifier=${oauthVerifier}`,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${responseText}`);
  }

  const params = new URLSearchParams(responseText);
  return {
    access_token: params.get("oauth_token")!,
    access_token_secret: params.get("oauth_token_secret")!,
    user_id: params.get("user_id")!,
    screen_name: params.get("screen_name")!,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET) {
      throw new Error("Twitter API credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get request token and redirect to Twitter
    if (pathname.endsWith('/twitter-oauth')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) throw new Error('Invalid authentication token');

      console.log('[TWITTER-OAUTH] Getting request token for user:', user.id);

      const { oauth_token, oauth_token_secret } = await getRequestToken();

      // Store the token secret temporarily with user association
      // We'll use it in the callback
      await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'twitter_temp',
          platform_user_id: oauth_token,
          username: oauth_token_secret, // Temporarily store secret here
          is_active: false
        });

      const authUrl = `https://api.x.com/oauth/authorize?oauth_token=${oauth_token}`;

      return new Response(
        JSON.stringify({ authUrl }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 2: Handle callback from Twitter
    if (pathname.endsWith('/callback')) {
      const oauth_token = url.searchParams.get('oauth_token');
      const oauth_verifier = url.searchParams.get('oauth_verifier');

      if (!oauth_token || !oauth_verifier) {
        throw new Error('Missing OAuth parameters');
      }

      console.log('[TWITTER-OAUTH] Processing callback');

      // Retrieve the stored token secret
      const { data: tempAccount, error: fetchError } = await supabaseClient
        .from('social_accounts')
        .select('*')
        .eq('platform', 'twitter_temp')
        .eq('platform_user_id', oauth_token)
        .maybeSingle();

      if (fetchError || !tempAccount) {
        throw new Error('OAuth session not found');
      }

      const oauth_token_secret = tempAccount.username; // We stored it here temporarily
      const user_id = tempAccount.user_id;

      // Get access token
      const { access_token, access_token_secret, user_id: twitter_user_id, screen_name } = 
        await getAccessToken(oauth_token, oauth_verifier, oauth_token_secret);

      console.log('[TWITTER-OAUTH] Got access token for @' + screen_name);

      // Check if account already exists
      const { data: existingAccount } = await supabaseClient
        .from('social_accounts')
        .select('id')
        .eq('user_id', user_id)
        .eq('platform', 'twitter')
        .eq('platform_user_id', twitter_user_id)
        .maybeSingle();

      if (existingAccount) {
        // Update existing account
        await supabaseClient
          .from('social_accounts')
          .update({
            username: screen_name,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);

        // Update tokens in vault
        await supabaseClient
          .from('social_tokens_vault')
          .upsert({
            social_account_id: existingAccount.id,
            encrypted_access_token: access_token,
            encrypted_refresh_token: access_token_secret, // Store token secret here
            updated_at: new Date().toISOString()
          });
      } else {
        // Create new social account
        const { data: newAccount, error: insertError } = await supabaseClient
          .from('social_accounts')
          .insert({
            user_id: user_id,
            platform: 'twitter',
            platform_user_id: twitter_user_id,
            username: screen_name,
            is_active: true
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Store tokens in vault
        await supabaseClient
          .from('social_tokens_vault')
          .insert({
            social_account_id: newAccount.id,
            encrypted_access_token: access_token,
            encrypted_refresh_token: access_token_secret // Store token secret here
          });
      }

      // Delete temporary record
      await supabaseClient
        .from('social_accounts')
        .delete()
        .eq('platform', 'twitter_temp')
        .eq('platform_user_id', oauth_token);

      // Return HTML that posts message to parent window and closes popup
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
            }
            .spinner {
              border: 3px solid rgba(255,255,255,0.3);
              border-top: 3px solid white;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
            .success-icon {
              background: rgba(255,255,255,0.2);
              animation: scaleIn 0.3s ease-out;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes scaleIn {
              0% { transform: scale(0); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            h1 { margin: 0 0 10px 0; font-size: 24px; }
            p { margin: 0; opacity: 0.9; }
            .fade-in { animation: fadeIn 0.3s ease-out; }
            #loading, #success { transition: opacity 0.2s ease-out; }
          </style>
        </head>
        <body>
          <div class="container">
            <div id="loading">
              <div class="icon spinner"></div>
              <h1>Connecting...</h1>
              <p>Finishing up</p>
            </div>
            <div id="success" style="display:none">
              <div class="icon success-icon">✓</div>
              <h1 class="fade-in">Connected!</h1>
              <p class="fade-in">@${screen_name}</p>
            </div>
          </div>
          <script>
            // Send message immediately
            if (window.opener) {
              window.opener.postMessage({
                type: 'TWITTER_AUTH_SUCCESS',
                screenName: '${screen_name}'
              }, '*');
            }
            // Brief loading state then show success
            setTimeout(() => {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('success').style.display = 'block';
              // Close quickly after showing success
              setTimeout(() => window.close(), 600);
            }, 400);
          </script>
        </body>
        </html>
      `;
      
      return new Response(successHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
        }
      });
    }

    throw new Error('Invalid endpoint');

  } catch (error: any) {
    console.error('[TWITTER-OAUTH] Error:', error);
    
    // If this is a callback error, return HTML for the popup
    if (url.pathname.endsWith('/callback')) {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connection Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .error-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 { margin: 0 0 10px 0; font-size: 24px; }
            p { margin: 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✕</div>
            <h1>Connection Failed</h1>
            <p>${error.message || 'Failed to connect Twitter account'}</p>
            <p style="margin-top: 20px; font-size: 14px;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'TWITTER_AUTH_ERROR',
                error: '${error.message || 'OAuth failed'}'
              }, '*');
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
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
