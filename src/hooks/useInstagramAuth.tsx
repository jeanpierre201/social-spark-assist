import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

// Helper to wait for FB SDK to be ready
const waitForFBSDK = (timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window.FB) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Facebook SDK failed to load. Please refresh the page and try again.'));
      }
    }, 100);
  });
};

export const useInstagramAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const showToast = useCallback((title: string, description: string, variant?: 'default' | 'destructive') => {
    toastRef.current({
      title,
      description,
      variant: variant || 'default',
    });
  }, []);

  const connectInstagram = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Wait for FB SDK to be ready
      await waitForFBSDK();
      console.log('[INSTAGRAM-AUTH] FB SDK ready, checking login status...');

      // Check login status
      window.FB.getLoginStatus((statusResponse: any) => {
        console.log('[INSTAGRAM-AUTH] Facebook login status:', statusResponse);

        if (statusResponse.status === 'connected') {
          console.log('[INSTAGRAM-AUTH] User already connected, getting Instagram accounts...');
          fetchInstagramAccounts(statusResponse.authResponse.accessToken);
        } else {
          console.log('[INSTAGRAM-AUTH] User not connected, prompting login...');
          doFacebookLogin();
        }
      });
    } catch (error: any) {
      console.error('[INSTAGRAM-AUTH] Connection error:', error);
      showToast('Connection Failed', error.message || 'Failed to connect to Instagram', 'destructive');
      setIsConnecting(false);
    }

    function doFacebookLogin() {
      // Force logout first to clear any cached permissions from previous auth attempts
      console.log('[INSTAGRAM-AUTH] Forcing logout to clear cached permissions...');
      window.FB.logout(() => {
        console.log('[INSTAGRAM-AUTH] Logged out, starting fresh login...');
        window.FB.login(
          (response: any) => {
            console.log('[INSTAGRAM-AUTH] Login response:', response);
            
            if (response.authResponse) {
              console.log('[INSTAGRAM-AUTH] Login successful, granted scopes:', response.authResponse.grantedScopes);
              
              const grantedScopes = response.authResponse.grantedScopes?.split(',') || [];
              
              // Check for required page permissions
              if (!grantedScopes.includes('pages_show_list')) {
                showToast(
                  'Insufficient Permissions',
                  'Please grant access to Facebook Pages to connect Instagram',
                  'destructive'
                );
                setIsConnecting(false);
                return;
              }
              
              fetchInstagramAccounts(response.authResponse.accessToken);
            } else {
              console.log('[INSTAGRAM-AUTH] Login cancelled or failed');
              showToast('Connection Cancelled', 'Instagram connection was cancelled', 'destructive');
              setIsConnecting(false);
            }
          },
          { 
            scope: 'pages_show_list,pages_manage_posts',
            auth_type: 'reauthorize', // Force fresh permission prompt
            return_scopes: true 
          }
        );
      });
    }

    function fetchInstagramAccounts(userAccessToken: string) {
      console.log('[INSTAGRAM-AUTH] Fetching Instagram Business accounts...');
      
      // First get user's Facebook pages
      window.FB.api('/me/accounts', { access_token: userAccessToken }, (pagesResponse: any) => {
        if (pagesResponse.error) {
          console.error('[INSTAGRAM-AUTH] Error fetching pages:', pagesResponse.error);
          showToast('Error', pagesResponse.error.message, 'destructive');
          setIsConnecting(false);
          return;
        }

        if (!pagesResponse.data || pagesResponse.data.length === 0) {
          console.log('[INSTAGRAM-AUTH] No Facebook pages found');
          showToast(
            'No Pages Found',
            'You need a Facebook Page connected to an Instagram Business account.',
            'destructive'
          );
          setIsConnecting(false);
          return;
        }

        // Check first page for connected Instagram account
        const page = pagesResponse.data[0];
        const pageAccessToken = page.access_token;

        console.log('[INSTAGRAM-AUTH] Checking page for Instagram account:', page.name);

        // Get Instagram Business Account connected to this page
        window.FB.api(
          `/${page.id}`,
          { 
            fields: 'instagram_business_account{id,username,profile_picture_url}',
            access_token: pageAccessToken 
          },
          async (igResponse: any) => {
            if (igResponse.error) {
              console.error('[INSTAGRAM-AUTH] Error fetching Instagram account:', igResponse.error);
              showToast('Error', igResponse.error.message, 'destructive');
              setIsConnecting(false);
              return;
            }

            if (!igResponse.instagram_business_account) {
              console.log('[INSTAGRAM-AUTH] No Instagram Business account connected');
              showToast(
                'No Instagram Account Found',
                'Connect an Instagram Business or Creator account to your Facebook Page first.',
                'destructive'
              );
              setIsConnecting(false);
              return;
            }

            const igAccount = igResponse.instagram_business_account;
            console.log('[INSTAGRAM-AUTH] Found Instagram account:', igAccount.username);

            // Save the connection to backend
            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (!session) {
                showToast('Error', 'Not authenticated', 'destructive');
                setIsConnecting(false);
                return;
              }

              const { data, error } = await supabase.functions.invoke('instagram-oauth', {
                body: {
                  accessToken: pageAccessToken,
                  instagramAccountId: igAccount.id,
                  instagramUsername: igAccount.username,
                  pageId: page.id,
                  pageName: page.name
                }
              });

              if (error) {
                console.error('[INSTAGRAM-AUTH] Backend error:', error);
                showToast('Error', error.message || 'Failed to save Instagram connection', 'destructive');
                setIsConnecting(false);
                return;
              }

              showToast('Success', `Connected to Instagram: @${igAccount.username}`);
              setIsConnecting(false);

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err: any) {
              console.error('[INSTAGRAM-AUTH] Unexpected error:', err);
              showToast('Error', err.message || 'An unexpected error occurred', 'destructive');
              setIsConnecting(false);
            }
          }
        );
      });
    }
  }, [showToast]);

  const postToInstagram = useCallback(async (accountId: string, message: string, imageUrl: string) => {
    if (!imageUrl) {
      showToast('Image Required', 'Instagram posts require an image', 'destructive');
      throw new Error('Instagram posts require an image');
    }

    try {
      const { data, error } = await supabase.functions.invoke('instagram-post', {
        body: {
          accountId,
          message,
          imageUrl
        }
      });

      if (error) throw error;

      showToast('Success', 'Posted to Instagram successfully!');
      return data;
    } catch (error: any) {
      console.error('Instagram post error:', error);
      showToast('Post Failed', error.message || 'Failed to post to Instagram', 'destructive');
      throw error;
    }
  }, [showToast]);

  return {
    connectInstagram,
    postToInstagram,
    isConnecting
  };
};
