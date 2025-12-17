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

    // Validate channel ID format - reject invite links
    if (channelId.includes('t.me/') || channelId.includes('telegram.me/') || channelId.includes('+')) {
      throw new Error('Invite links are not supported. Use @channelname for public channels or numeric ID for private channels.');
    }

    // Allow: @username format OR numeric-based ID (the frontend already formats with -100)
    const isPublicChannel = channelId.startsWith('@');
    const isPrivateChannel = /^-100\d{10,}$/.test(channelId);
    
    if (!isPublicChannel && !isPrivateChannel) {
      throw new Error('Invalid Channel ID format. Expected @channelname or -100xxxxxxxxxx format.');
    }

    // Verify the bot can access the channel by calling getChat
    console.log(`[TELEGRAM-CONNECT] Testing channel access for ${channelId}...`);
    const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channelId })
    });
    
    const testData = await testResponse.json();
    
    if (!testData.ok) {
      console.error('[TELEGRAM-CONNECT] Channel test failed:', testData);
      
      let errorMessage = testData.description || 'Failed to access channel';
      
      if (testData.error_code === 400 && testData.description?.includes('chat not found')) {
        errorMessage = 'Channel not found. Make sure the Channel ID is correct and the bot is added as admin to the channel.';
      } else if (testData.error_code === 403) {
        errorMessage = 'Bot cannot access this channel. Please add the bot as admin to the channel first.';
      } else if (testData.error_code === 401) {
        errorMessage = 'Invalid Bot Token. Please check your token is correct.';
      }
      
      throw new Error(errorMessage);
    }
    
    console.log(`[TELEGRAM-CONNECT] Channel verified: ${testData.result?.title || channelId}`);

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
