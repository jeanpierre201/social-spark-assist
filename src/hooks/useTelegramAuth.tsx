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

      // Call edge function to securely store credentials (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('telegram-connect', {
        body: {
          botToken: credentials.botToken,
          channelId,
          channelName: credentials.channelName,
          botInfo: validation.botInfo
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
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
