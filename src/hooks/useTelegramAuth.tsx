import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TelegramCredentials {
  botToken: string;
  channelId: string;
  channelName?: string;
}

export const useTelegramAuth = (onSuccess?: () => void) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateBotToken = async (botToken: string): Promise<{ valid: boolean; botInfo?: any; error?: string }> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        return { valid: true, botInfo: data.result };
      } else {
        return { valid: false, error: data.description || 'Invalid bot token' };
      }
    } catch (error) {
      return { valid: false, error: 'Failed to verify bot token' };
    }
  };

  const connectTelegram = async (credentials: TelegramCredentials) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to connect Telegram',
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsConnecting(true);

    try {
      console.log('[TELEGRAM-AUTH] Starting connection...');

      // Validate bot token first
      const validation = await validateBotToken(credentials.botToken);
      if (!validation.valid) {
        toast({
          title: 'Invalid Bot Token',
          description: validation.error || 'Please check your bot token',
          variant: 'destructive',
        });
        return { success: false };
      }

      console.log('[TELEGRAM-AUTH] Bot validated:', validation.botInfo?.username);

      // Format channel ID - add @ prefix for public channels if needed
      let channelId = credentials.channelId.trim();
      if (!channelId.startsWith('@') && !channelId.startsWith('-')) {
        // If it looks like a username without @, add it
        if (!/^\d+$/.test(channelId)) {
          channelId = '@' + channelId;
        }
      }

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'telegram')
        .single();

      let accountId: string;

      if (existingAccount) {
        // Update existing account
        const { error: updateError } = await supabase
          .from('social_accounts')
          .update({
            platform_user_id: channelId,
            username: credentials.channelName || validation.botInfo?.username,
            is_active: true,
            account_data: {
              bot_username: validation.botInfo?.username,
              bot_id: validation.botInfo?.id,
              channel_name: credentials.channelName
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);

        if (updateError) {
          throw updateError;
        }

        accountId = existingAccount.id;

        // Delete old token and insert new one
        await supabase
          .from('social_tokens_vault')
          .delete()
          .eq('social_account_id', accountId);
      } else {
        // Create new account
        const { data: newAccount, error: insertError } = await supabase
          .from('social_accounts')
          .insert({
            user_id: user.id,
            platform: 'telegram',
            platform_user_id: channelId,
            username: credentials.channelName || validation.botInfo?.username,
            is_active: true,
            account_data: {
              bot_username: validation.botInfo?.username,
              bot_id: validation.botInfo?.id,
              channel_name: credentials.channelName
            }
          })
          .select('id')
          .single();

        if (insertError || !newAccount) {
          throw insertError || new Error('Failed to create account');
        }

        accountId = newAccount.id;
      }

      // Store bot token in vault
      const { error: vaultError } = await supabase
        .from('social_tokens_vault')
        .insert({
          social_account_id: accountId,
          encrypted_access_token: credentials.botToken,
          encryption_key_id: 'telegram-bot-token'
        });

      if (vaultError) {
        console.error('[TELEGRAM-AUTH] Vault error:', vaultError);
        // Clean up the account if vault insert fails
        await supabase.from('social_accounts').delete().eq('id', accountId);
        throw new Error('Failed to securely store bot token');
      }

      console.log('[TELEGRAM-AUTH] Successfully connected');
      
      toast({
        title: 'Telegram Connected!',
        description: `Connected to channel ${channelId}`,
      });

      setShowDialog(false);
      onSuccess?.();
      
      return { success: true };
    } catch (error: any) {
      console.error('[TELEGRAM-AUTH] Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Telegram',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsConnecting(false);
    }
  };

  const openConnectionDialog = () => {
    setShowDialog(true);
  };

  const closeConnectionDialog = () => {
    setShowDialog(false);
  };

  return {
    connectTelegram,
    isConnecting,
    showDialog,
    openConnectionDialog,
    closeConnectionDialog,
    validateBotToken
  };
};
