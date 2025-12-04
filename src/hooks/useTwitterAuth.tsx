import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTwitterAuth = (onSuccess?: () => void) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Handle successful auth
  const handleSuccess = useCallback((screenName: string) => {
    cleanup();
    setIsConnecting(false);
    toast({
      title: 'Success',
      description: `Connected to Twitter as @${screenName}`,
    });
    
    if (onSuccess) {
      onSuccess();
    } else {
      setTimeout(() => window.location.reload(), 1000);
    }
  }, [cleanup, toast, onSuccess]);

  // Handle auth error
  const handleError = useCallback((errorMessage: string) => {
    cleanup();
    setIsConnecting(false);
    toast({
      title: 'Connection Failed',
      description: errorMessage || 'Failed to connect Twitter account',
      variant: 'destructive',
    });
  }, [cleanup, toast]);

  // Listen for messages from popup window (Method 1: postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
        console.log('[TWITTER-AUTH] Received success via postMessage:', event.data);
        handleSuccess(event.data.screenName);
      } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
        console.error('[TWITTER-AUTH] Received error via postMessage:', event.data);
        handleError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleSuccess, handleError]);

  // Start localStorage polling (Method 2: fallback for cross-origin)
  const startLocalStoragePolling = useCallback(() => {
    // Clear any stale data first
    try {
      localStorage.removeItem('twitter_auth_result');
    } catch (e) {
      // Ignore
    }

    // Poll every 500ms
    pollIntervalRef.current = setInterval(() => {
      try {
        const result = localStorage.getItem('twitter_auth_result');
        if (result) {
          const data = JSON.parse(result);
          // Only process if recent (within last 60 seconds)
          if (Date.now() - data.timestamp < 60000) {
            console.log('[TWITTER-AUTH] Received result via localStorage:', data);
            localStorage.removeItem('twitter_auth_result');
            
            if (data.success) {
              handleSuccess(data.screenName);
            } else {
              handleError(data.error);
            }
          } else {
            // Clear stale data
            localStorage.removeItem('twitter_auth_result');
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }, 500);

    // Timeout after 2 minutes
    timeoutRef.current = setTimeout(() => {
      if (isConnecting) {
        handleError('Connection timed out. Please try again.');
      }
    }, 120000);
  }, [handleSuccess, handleError, isConnecting]);

  const connectTwitter = useCallback(async () => {
    setIsConnecting(true);

    // Show connecting toast immediately
    toast({
      title: 'Connecting to Twitter',
      description: 'Please authorize in the popup window...',
    });

    try {
      // First check if user is logged in with a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Login Required',
          description: 'Please log in to connect your Twitter account',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      console.log('[TWITTER-AUTH] Session valid, user:', session.user.email);
      console.log('[TWITTER-AUTH] Starting OAuth flow...');

      // Call our edge function to get the auth URL, passing frontend origin for redirect
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { frontendOrigin: window.location.origin }
      });

      if (error) {
        // Handle auth errors specifically
        if (error.message?.includes('Missing authorization header') || 
            error.message?.includes('401')) {
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          setIsConnecting(false);
          return;
        }
        throw new Error(error.message || 'Failed to start Twitter authentication');
      }

      if (!data?.authUrl) {
        throw new Error('No authorization URL received');
      }

      console.log('[TWITTER-AUTH] Opening popup with auth URL');

      // Start localStorage polling before opening popup
      startLocalStoragePolling();

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
        cleanup();
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Check if popup was closed without completing auth
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          // Give a small delay to allow localStorage to be read
          setTimeout(() => {
            if (isConnecting) {
              // Only show cancelled if we haven't already processed a result
              const result = localStorage.getItem('twitter_auth_result');
              if (!result) {
                cleanup();
                setIsConnecting(false);
              }
            }
          }, 1000);
        }
      }, 500);

    } catch (error: any) {
      console.error('[TWITTER-AUTH] Error:', error);
      cleanup();
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Twitter',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  }, [toast, cleanup, startLocalStoragePolling, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    connectTwitter,
    isConnecting
  };
};
