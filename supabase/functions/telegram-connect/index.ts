import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { botToken, channelId, channelName, botInfo } = await req.json();

    if (!botToken || !channelId) {
      throw new Error('Bot token and channel ID are required');
    }

    console.log(`[TELEGRAM-CONNECT] Connecting user ${user.id} to channel ${channelId}`);

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'telegram')
      .single();

    let accountId: string;

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabaseClient
        .from('social_accounts')
        .update({
          platform_user_id: channelId,
          username: channelName || botInfo?.username,
          is_active: true,
          account_data: {
            bot_username: botInfo?.username,
            bot_id: botInfo?.id,
            channel_name: channelName
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('[TELEGRAM-CONNECT] Update error:', updateError);
        throw updateError;
      }

      accountId = existingAccount.id;

      // Delete old token
      await supabaseClient
        .from('social_tokens_vault')
        .delete()
        .eq('social_account_id', accountId);
    } else {
      // Create new account
      const { data: newAccount, error: insertError } = await supabaseClient
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'telegram',
          platform_user_id: channelId,
          username: channelName || botInfo?.username,
          is_active: true,
          account_data: {
            bot_username: botInfo?.username,
            bot_id: botInfo?.id,
            channel_name: channelName
          }
        })
        .select('id')
        .single();

      if (insertError || !newAccount) {
        console.error('[TELEGRAM-CONNECT] Insert error:', insertError);
        throw insertError || new Error('Failed to create account');
      }

      accountId = newAccount.id;
    }

    // Store bot token securely in vault (using service role key bypasses RLS)
    const { error: vaultError } = await supabaseClient
      .from('social_tokens_vault')
      .insert({
        social_account_id: accountId,
        encrypted_access_token: botToken,
        encryption_key_id: 'telegram-bot-token'
      });

    if (vaultError) {
      console.error('[TELEGRAM-CONNECT] Vault error:', vaultError);
      // Clean up the account if vault insert fails
      await supabaseClient.from('social_accounts').delete().eq('id', accountId);
      throw new Error('Failed to securely store bot token');
    }

    console.log(`[TELEGRAM-CONNECT] Successfully connected channel ${channelId}`);

    return new Response(
      JSON.stringify({ success: true, channelId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TELEGRAM-CONNECT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
