import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();

function validateEnvironmentVariables() {
  if (!API_KEY) throw new Error("Missing TWITTER_CONSUMER_KEY");
  if (!API_SECRET) throw new Error("Missing TWITTER_CONSUMER_SECRET");
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(method: string, url: string, accessToken: string, accessTokenSecret: string): string {
  const oauthParams = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, API_SECRET!, accessTokenSecret);
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };
  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));
  
  return "OAuth " + entries.map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

async function sendTweet(tweetText: string, accessToken: string, accessTokenSecret: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, url, accessToken, accessTokenSecret);

  console.log('[TWITTER-POST] Posting tweet');

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();
  console.log('[TWITTER-POST] Response:', response.status, responseText);

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    validateEnvironmentVariables();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) throw new Error('Invalid authentication token');

    const { message, accountId } = await req.json();
    
    if (!message) throw new Error('Missing message');
    if (!accountId) throw new Error('Missing Twitter account ID');

    console.log('[TWITTER-POST] User:', user.id, 'Account:', accountId, 'Message length:', message.length);

    // Get the Twitter account and tokens
    const { data: account, error: accountError } = await supabaseClient
      .from('social_accounts')
      .select('id, platform_user_id, username')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      throw new Error('Twitter account not found or not connected');
    }

    // Get tokens from vault
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('social_tokens_vault')
      .select('encrypted_access_token, encrypted_refresh_token')
      .eq('social_account_id', accountId)
      .single();

    if (tokensError || !tokens || !tokens.encrypted_access_token || !tokens.encrypted_refresh_token) {
      throw new Error('Twitter tokens not found. Please reconnect your account.');
    }

    console.log('[TWITTER-POST] Using tokens for account @' + account.username);

    const result = await sendTweet(message, tokens.encrypted_access_token, tokens.encrypted_refresh_token);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Tweet posted successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[TWITTER-POST] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to post tweet' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
