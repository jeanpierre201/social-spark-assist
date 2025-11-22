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

    const { accessToken, pageId, pageName } = await req.json();
    
    if (!accessToken) {
      throw new Error('Missing access token');
    }

    console.log('Connecting Facebook account for user:', user.id);

    // Get user info from Facebook
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
    );
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('Facebook API error:', errorText);
      throw new Error(`Failed to fetch Facebook user info: ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('Facebook user info:', userInfo);

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .eq('platform_user_id', pageId || userInfo.id)
      .maybeSingle();

    const accountData = {
      page_id: pageId,
      page_name: pageName,
      user_name: userInfo.name
    };

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabaseClient
        .from('social_accounts')
        .update({
          username: pageName || userInfo.name,
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

      console.log('Updated existing Facebook account');
    } else {
      // Create new social account
      const { data: newAccount, error: insertError } = await supabaseClient
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'facebook',
          platform_user_id: pageId || userInfo.id,
          username: pageName || userInfo.name,
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

      console.log('Created new Facebook account');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Facebook account connected successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in facebook-oauth:', error);
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