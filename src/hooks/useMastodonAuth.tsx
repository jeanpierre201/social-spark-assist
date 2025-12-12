import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MastodonAuthResult {
  success: boolean;
  username?: string;
  error?: string;
}

export const useMastodonAuth = (onSuccess?: () => void) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MASTODON_AUTH_SUCCESS') {
        toast({
          title: 'Mastodon Connected',
          description: `Connected as @${event.data.username}`,
        });
        setIsConnecting(false);
        onSuccess?.();
      } else if (event.data?.type === 'MASTODON_AUTH_ERROR') {
        toast({
          title: 'Connection Failed',
          description: event.data.error || 'Failed to connect Mastodon account',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, onSuccess]);

  // Check localStorage for results (fallback)
  useEffect(() => {
    const checkLocalStorage = () => {
      const result = localStorage.getItem('mastodon_auth_result');
      if (result) {
        try {
          const parsed = JSON.parse(result) as MastodonAuthResult & { timestamp: number };
          // Only process if recent (within last 30 seconds)
          if (Date.now() - parsed.timestamp < 30000) {
            localStorage.removeItem('mastodon_auth_result');
            if (parsed.success) {
              toast({
                title: 'Mastodon Connected',
                description: `Connected as @${parsed.username}`,
              });
              onSuccess?.();
            } else {
              toast({
                title: 'Connection Failed',
                description: parsed.error || 'Failed to connect Mastodon account',
                variant: 'destructive',
              });
            }
            setIsConnecting(false);
          } else {
            localStorage.removeItem('mastodon_auth_result');
          }
        } catch {
          localStorage.removeItem('mastodon_auth_result');
        }
      }
    };

    // Check periodically
    const interval = setInterval(checkLocalStorage, 1000);
    return () => clearInterval(interval);
  }, [toast, onSuccess]);

  const connectMastodon = useCallback(async (instanceUrl?: string) => {
    setIsConnecting(true);
    
    try {
      // Prompt for instance URL if not provided
      const instance = instanceUrl || prompt(
        'Enter your Mastodon instance URL (e.g., mastodon.social, fosstodon.org):',
        'mastodon.social'
      );
      
      if (!instance) {
        setIsConnecting(false);
        return { success: false, error: 'Instance URL is required' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('You must be logged in to connect Mastodon');
      }

      const { data, error } = await supabase.functions.invoke('mastodon-oauth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          instanceUrl: instance,
          frontendOrigin: window.location.origin,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to start Mastodon OAuth');
      }

      if (data?.authUrl) {
        // Open popup for OAuth
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'mastodon-oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );

        if (!popup) {
          throw new Error('Popup was blocked. Please allow popups for this site.');
        }

        return { success: true };
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error: any) {
      console.error('Mastodon connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Mastodon account',
        variant: 'destructive',
      });
      setIsConnecting(false);
      return { success: false, error: error.message };
    }
  }, [toast]);

  const disconnectMastodon = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', 'mastodon');

      if (error) {
        throw error;
      }

      toast({
        title: 'Mastodon Disconnected',
        description: 'Your Mastodon account has been disconnected.',
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Mastodon disconnect error:', error);
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect Mastodon account',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  return {
    connectMastodon,
    disconnectMastodon,
    isConnecting,
  };
};
