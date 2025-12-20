import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const useFacebookAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Watchdog so the UI never gets stuck in "Connecting..." forever
  const watchdogRef = useRef<number | null>(null);

  const stopWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const startWatchdog = useCallback(() => {
    stopWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      console.warn('[FACEBOOK-AUTH] Connection watchdog timeout fired');
      toast({
        title: 'Connection Timed Out',
        description: 'The Facebook login did not complete. Please disable popup blockers and try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
      watchdogRef.current = null;
    }, 15000);
  }, [stopWatchdog, toast]);

  const connectFacebook = async () => {
    setIsConnecting(true);
    startWatchdog();

    try {
      // Check if FB SDK is loaded
      if (!window.FB) {
        throw new Error('Facebook SDK not loaded');
      }

      // First check if user is already logged into Facebook
      window.FB.getLoginStatus((statusResponse: any) => {
        console.log('Facebook login status:', statusResponse);

        if (statusResponse.status === 'connected') {
          // User is already logged into Facebook, get their pages
          console.log('User already connected to Facebook, getting pages...');
          handleFacebookPages(statusResponse.authResponse.accessToken);
        } else {
          // User needs to log into Facebook
          console.log('User not connected, prompting login...');
          promptFacebookLogin();
        }
      });
    } catch (error: any) {
      console.error('Facebook connection error:', error);
      stopWatchdog();
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Facebook',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const promptFacebookLogin = () => {
    const startLogin = () => {
      console.log('[FACEBOOK-AUTH] Starting FB.login with reauthorize...');
      window.FB.login(
        (response: any) => {
          console.log('[FACEBOOK-AUTH] Login response:', response);

          if (response.authResponse) {
            console.log('[FACEBOOK-AUTH] Login successful, granted scopes:', response.authResponse.grantedScopes);

            // Check if we got the required permissions
            const grantedScopes = response.authResponse.grantedScopes?.split(',') || [];
            console.log('[FACEBOOK-AUTH] Granted scopes:', grantedScopes);

            if (!grantedScopes.includes('pages_show_list')) {
              stopWatchdog();
              toast({
                title: 'Insufficient Permissions',
                description: 'Please grant access to view your Facebook Pages',
                variant: 'destructive',
              });
              setIsConnecting(false);
              return;
            }

            handleFacebookPages(response.authResponse.accessToken);
          } else {
            stopWatchdog();
            console.log('[FACEBOOK-AUTH] Login cancelled or failed');
            toast({
              title: 'Connection Cancelled',
              description: 'Facebook connection was cancelled',
              variant: 'destructive',
            });
            setIsConnecting(false);
          }
        },
        {
          scope: 'pages_show_list,pages_manage_posts',
          auth_type: 'reauthorize',
          return_scopes: true,
        }
      );
    };

    // If the user isn't connected, FB.logout may not fire its callback.
    // So we attempt logout, but guarantee we proceed to login.
    console.log('[FACEBOOK-AUTH] Attempting FB.logout to clear cached permissions...');
    let proceeded = false;
    const proceed = () => {
      if (proceeded) return;
      proceeded = true;
      startLogin();
    };

    try {
      window.FB.logout(() => {
        console.log('[FACEBOOK-AUTH] FB.logout callback fired');
        proceed();
      });
    } catch (e) {
      console.warn('[FACEBOOK-AUTH] FB.logout threw, proceeding to login', e);
      proceed();
    }

    // Fallback: proceed even if logout callback never fires
    setTimeout(() => {
      console.log('[FACEBOOK-AUTH] FB.logout fallback timer fired');
      proceed();
    }, 600);
  };

  const handleFacebookPages = (userAccessToken: string) => {
    console.log('[FACEBOOK-AUTH] Fetching user pages...');

    // Get user's pages with their access tokens
    window.FB.api('/me/accounts', (pagesResponse: any) => {
      if (pagesResponse.error) {
        console.error('[FACEBOOK-AUTH] Error fetching pages:', pagesResponse.error);
        stopWatchdog();
        toast({
          title: 'Error',
          description: pagesResponse.error.message,
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      if (!pagesResponse.data || pagesResponse.data.length === 0) {
        console.log('[FACEBOOK-AUTH] No pages found for user');
        stopWatchdog();
        toast({
          title: 'No Pages Found',
          description: 'You need to have a Facebook Page to connect. Please create one first.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      console.log('[FACEBOOK-AUTH] Found pages:', pagesResponse.data.length);

      // Use the first page (you can add page selection UI later)
      const page = pagesResponse.data[0];
      const pageAccessToken = page.access_token;

      console.log('[FACEBOOK-AUTH] Using page:', page.name, 'ID:', page.id);

      // Call our backend to store the connection
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          stopWatchdog();
          toast({
            title: 'Error',
            description: 'Not authenticated',
            variant: 'destructive',
          });
          setIsConnecting(false);
          return;
        }

        supabase.functions.invoke('facebook-oauth', {
          body: {
            accessToken: pageAccessToken,
            pageId: page.id,
            pageName: page.name
          }
        }).then(({ data, error }) => {
          if (error) {
            stopWatchdog();
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
            setIsConnecting(false);
            return;
          }

          stopWatchdog();
          toast({
            title: 'Success',
            description: `Connected to Facebook Page: ${page.name}`,
          });

          // Refresh the page to update the UI
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      });
    });
  };

  const postToFacebook = async (accountId: string, message: string, imageUrl?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-post', {
        body: {
          accountId,
          message,
          imageUrl
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Posted to Facebook successfully!',
      });

      return data;
    } catch (error: any) {
      console.error('Facebook post error:', error);
      toast({
        title: 'Post Failed',
        description: error.message || 'Failed to post to Facebook',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    connectFacebook,
    postToFacebook,
    isConnecting
  };
};