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

    const { accessToken, instagramAccountId, instagramUsername, pageId, pageName } = await req.json();
    
    if (!accessToken || !instagramAccountId) {
      throw new Error('Missing required fields');
    }

    console.log('[INSTAGRAM-OAUTH] Connecting Instagram account for user:', user.id);
    console.log('[INSTAGRAM-OAUTH] Instagram Account ID:', instagramAccountId);
    console.log('[INSTAGRAM-OAUTH] Username:', instagramUsername);

    const accountData = {
      instagram_account_id: instagramAccountId,
      instagram_username: instagramUsername,
      page_id: pageId,
      page_name: pageName,
    };

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .eq('platform_user_id', instagramAccountId)
      .maybeSingle();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabaseClient
        .from('social_accounts')
        .update({
          username: instagramUsername,
          account_data: accountData,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id);

      if (updateError) throw updateError;

      // Update tokens in vault
      const { error: tokenError } = await supabaseClient
        .from('social_tokens_vault')
        .upsert({
          social_account_id: existingAccount.id,
          encrypted_access_token: accessToken,
          updated_at: new Date().toISOString()
        });

      if (tokenError) throw tokenError;

      console.log('[INSTAGRAM-OAUTH] Updated existing Instagram account');
    } else {
      // Create new social account
      const { data: newAccount, error: insertError } = await supabaseClient
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'instagram',
          platform_user_id: instagramAccountId,
          username: instagramUsername,
          account_data: accountData,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store tokens in vault
      const { error: tokenError } = await supabaseClient
        .from('social_tokens_vault')
        .insert({
          social_account_id: newAccount.id,
          encrypted_access_token: accessToken
        });

      if (tokenError) throw tokenError;

      console.log('[INSTAGRAM-OAUTH] Created new Instagram account');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instagram account connected successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[INSTAGRAM-OAUTH] Error:', error);
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
