import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTwitterAuth = (onSuccess?: () => void) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (should come from our Supabase functions domain)
      if (!event.data || typeof event.data !== 'object') return;
      
      if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
        console.log('[TWITTER-AUTH] Received success message:', event.data);
        setIsConnecting(false);
        toast({
          title: 'Success',
          description: `Connected to Twitter as @${event.data.screenName}`,
        });
        
        // Refresh accounts or trigger callback
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => window.location.reload(), 1000);
        }
      } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
        console.error('[TWITTER-AUTH] Received error message:', event.data);
        setIsConnecting(false);
        toast({
          title: 'Connection Failed',
          description: event.data.error || 'Failed to connect Twitter account',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, onSuccess]);

  const connectTwitter = useCallback(async () => {
    setIsConnecting(true);

    try {
      // First check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Login Required',
          description: 'Please log in to connect your Twitter account',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      console.log('[TWITTER-AUTH] Starting OAuth flow...');

      // Call our edge function to get the auth URL
      const { data, error } = await supabase.functions.invoke('twitter-oauth');

      if (error) {
        throw new Error(error.message || 'Failed to start Twitter authentication');
      }

      if (!data?.authUrl) {
        throw new Error('No authorization URL received');
      }

      console.log('[TWITTER-AUTH] Opening popup with auth URL');

      // Open popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.authUrl,
        'Twitter Login',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Check if popup was closed without completing auth
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
        }
      }, 500);

    } catch (error: any) {
      console.error('[TWITTER-AUTH] Error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Twitter',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  }, [toast]);

  return {
    connectTwitter,
    isConnecting
  };
};
