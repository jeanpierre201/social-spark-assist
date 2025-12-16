import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Smart truncation function for natural breaks
function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const reservedForEllipsis = 3;
  const targetLength = maxLength - reservedForEllipsis;
  
  if (targetLength <= 0) return text.substring(0, maxLength);
  
  // First try: Find last complete sentence
  const sentenceEndPattern = /[.!?。！？]\s/g;
  let lastSentenceEnd = -1;
  let match;
  
  while ((match = sentenceEndPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastSentenceEnd = endPos;
    } else {
      break;
    }
  }
  
  if (lastSentenceEnd > targetLength * 0.4) {
    return text.substring(0, lastSentenceEnd).trim();
  }
  
  // Second try: Break at special characters or emojis
  const breakPointPattern = /[,;:\-–—|•·]\s|[\u{1F300}-\u{1F9FF}][\s]?/gu;
  let lastBreakPoint = -1;
  
  while ((match = breakPointPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastBreakPoint = endPos;
    } else {
      break;
    }
  }
  
  if (lastBreakPoint > targetLength * 0.5) {
    return text.substring(0, lastBreakPoint).trim() + '...';
  }
  
  // Third try: Break at last word boundary
  const truncated = text.substring(0, targetLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > targetLength * 0.6) {
    return text.substring(0, lastSpace).trim() + '...';
  }
  
  // Fallback: Hard cut
  return text.substring(0, targetLength).trim() + '...';
}

const TELEGRAM_LIMIT = 4096;

interface TelegramError {
  ok: boolean;
  error_code?: number;
  description?: string;
}

async function postToTelegram(
  botToken: string, 
  channelId: string, 
  message: string, 
  imageUrl?: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  console.log('[TELEGRAM-POST] Posting to channel:', channelId);
  
  // Apply smart truncation for Telegram's 4096 char limit
  const truncatedMessage = smartTruncate(message, TELEGRAM_LIMIT);
  if (truncatedMessage.length !== message.length) {
    console.log(`[TELEGRAM-POST] Smart truncated from ${message.length} to ${truncatedMessage.length} chars`);
  }

  const baseUrl = `https://api.telegram.org/bot${botToken}`;
  
  try {
    let response: Response;
    
    if (imageUrl) {
      // Send photo with caption
      console.log('[TELEGRAM-POST] Sending photo with caption...');
      response = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          photo: imageUrl,
          caption: truncatedMessage,
          parse_mode: 'HTML'
        })
      });
    } else {
      // Send text message
      console.log('[TELEGRAM-POST] Sending text message...');
      response = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: truncatedMessage,
          parse_mode: 'HTML'
        })
      });
    }

    const data = await response.json();
    
    if (!data.ok) {
      const errorData = data as TelegramError;
      console.error('[TELEGRAM-POST] API error:', errorData);
      
      // Provide user-friendly error messages
      let errorMessage = errorData.description || 'Unknown Telegram error';
      
      if (errorData.error_code === 401) {
        errorMessage = 'Invalid bot token. Please check your Bot Token is correct.';
      } else if (errorData.error_code === 400 && errorData.description?.includes('chat not found')) {
        errorMessage = 'Channel not found. Make sure the bot is added as admin to the channel and the Channel ID is correct.';
      } else if (errorData.error_code === 403) {
        errorMessage = 'Bot was blocked or kicked from the channel. Please re-add the bot as admin.';
      }
      
      return { success: false, error: errorMessage };
    }

    console.log('[TELEGRAM-POST] Success, message ID:', data.result?.message_id);
    return { success: true, messageId: data.result?.message_id };
  } catch (error: any) {
    console.error('[TELEGRAM-POST] Network error:', error);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, postId, mediaUrl } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TELEGRAM-POST] Request from user:', user.id);
    console.log('[TELEGRAM-POST] Post ID:', postId);

    // Get user's Telegram account
    const { data: account, error: accountError } = await supabaseClient
      .from('social_accounts')
      .select('id, platform_user_id, account_data')
      .eq('user_id', user.id)
      .eq('platform', 'telegram')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('[TELEGRAM-POST] No Telegram account found:', accountError);
      return new Response(
        JSON.stringify({ 
          error: 'No Telegram channel connected. Please connect your Telegram bot first.',
          tip: 'Go to Social Media Settings to add your Bot Token and Channel ID'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bot token from vault
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('social_tokens_vault')
      .select('encrypted_access_token')
      .eq('social_account_id', account.id)
      .single();

    if (tokenError || !tokenData?.encrypted_access_token) {
      console.error('[TELEGRAM-POST] No bot token found:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Bot token not found. Please reconnect your Telegram channel.',
          tip: 'Go to Social Media Settings and reconnect your Telegram bot'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Channel ID is stored in platform_user_id
    const channelId = account.platform_user_id;
    const botToken = tokenData.encrypted_access_token;

    if (!channelId) {
      return new Response(
        JSON.stringify({ 
          error: 'Channel ID not found. Please reconnect your Telegram channel.',
          tip: 'Go to Social Media Settings and add your Channel ID'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Post to Telegram
    const result = await postToTelegram(botToken, channelId, message, mediaUrl);

    if (!result.success) {
      console.error('[TELEGRAM-POST] Failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TELEGRAM-POST] Successfully posted, message ID:', result.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        platform: 'telegram'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TELEGRAM-POST] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
