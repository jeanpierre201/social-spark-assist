import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  platform_user_id?: string;
  username?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const { platform, tokens }: { platform: string; tokens: OAuthTokens } = await req.json()
    
    if (!platform || !tokens.access_token) {
      throw new Error('Missing required fields: platform and access_token')
    }

    // Calculate expiration date if provided
    const tokenExpiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('platform_user_id', tokens.platform_user_id || '')
      .single()

    if (existingAccount) {
      // Update existing account using secure function
      const { error: updateError } = await supabaseClient.rpc('update_social_account_tokens', {
        account_id: existingAccount.id,
        new_access_token: tokens.access_token,
        new_refresh_token: tokens.refresh_token || null,
        new_expires_at: tokenExpiresAt
      })

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new social account
      const { error: insertError } = await supabaseClient
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: platform,
          platform_user_id: tokens.platform_user_id || '',
          username: tokens.username || null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          is_active: true
        })

      if (insertError) {
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Social account connected successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in handle-oauth-callback:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})