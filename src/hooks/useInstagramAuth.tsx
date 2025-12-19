import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const useInstagramAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectInstagram = async () => {
    setIsConnecting(true);

    try {
      // Check if FB SDK is loaded
      if (!window.FB) {
        throw new Error('Facebook SDK not loaded');
      }

      // First check if user is already logged into Facebook
      window.FB.getLoginStatus((statusResponse: any) => {
        console.log('[INSTAGRAM-AUTH] Facebook login status:', statusResponse);

        if (statusResponse.status === 'connected') {
          console.log('[INSTAGRAM-AUTH] User already connected, getting Instagram accounts...');
          handleInstagramAccounts(statusResponse.authResponse.accessToken);
        } else {
          console.log('[INSTAGRAM-AUTH] User not connected, prompting login...');
          promptFacebookLogin();
        }
      });
    } catch (error: any) {
      console.error('[INSTAGRAM-AUTH] Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Instagram',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const promptFacebookLogin = () => {
    window.FB.login(
      (response: any) => {
        console.log('[INSTAGRAM-AUTH] Login response:', response);
        
        if (response.authResponse) {
          console.log('[INSTAGRAM-AUTH] Login successful, granted scopes:', response.authResponse.grantedScopes);
          
          const grantedScopes = response.authResponse.grantedScopes?.split(',') || [];
          
          // Check for required Instagram permissions
          if (!grantedScopes.includes('instagram_basic') || !grantedScopes.includes('pages_show_list')) {
            toast({
              title: 'Insufficient Permissions',
              description: 'Please grant access to Instagram Business account and Facebook Pages',
              variant: 'destructive',
            });
            setIsConnecting(false);
            return;
          }
          
          handleInstagramAccounts(response.authResponse.accessToken);
        } else {
          console.log('[INSTAGRAM-AUTH] Login cancelled or failed');
          toast({
            title: 'Connection Cancelled',
            description: 'Instagram connection was cancelled',
            variant: 'destructive',
          });
          setIsConnecting(false);
        }
      },
      { 
        scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
        return_scopes: true 
      }
    );
  };

  const handleInstagramAccounts = (userAccessToken: string) => {
    console.log('[INSTAGRAM-AUTH] Fetching Instagram Business accounts...');
    
    // First get user's Facebook pages
    window.FB.api('/me/accounts', { access_token: userAccessToken }, (pagesResponse: any) => {
      if (pagesResponse.error) {
        console.error('[INSTAGRAM-AUTH] Error fetching pages:', pagesResponse.error);
        toast({
          title: 'Error',
          description: pagesResponse.error.message,
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      if (!pagesResponse.data || pagesResponse.data.length === 0) {
        console.log('[INSTAGRAM-AUTH] No Facebook pages found');
        toast({
          title: 'No Pages Found',
          description: 'You need a Facebook Page connected to an Instagram Business account.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      // Check each page for connected Instagram account
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
        (igResponse: any) => {
          if (igResponse.error) {
            console.error('[INSTAGRAM-AUTH] Error fetching Instagram account:', igResponse.error);
            toast({
              title: 'Error',
              description: igResponse.error.message,
              variant: 'destructive',
            });
            setIsConnecting(false);
            return;
          }

          if (!igResponse.instagram_business_account) {
            console.log('[INSTAGRAM-AUTH] No Instagram Business account connected');
            toast({
              title: 'No Instagram Account Found',
              description: 'Connect an Instagram Business or Creator account to your Facebook Page first.',
              variant: 'destructive',
            });
            setIsConnecting(false);
            return;
          }

          const igAccount = igResponse.instagram_business_account;
          console.log('[INSTAGRAM-AUTH] Found Instagram account:', igAccount.username);

          // Save the connection to backend
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              toast({
                title: 'Error',
                description: 'Not authenticated',
                variant: 'destructive',
              });
              setIsConnecting(false);
              return;
            }

            supabase.functions.invoke('instagram-oauth', {
              body: {
                accessToken: pageAccessToken,
                instagramAccountId: igAccount.id,
                instagramUsername: igAccount.username,
                pageId: page.id,
                pageName: page.name
              }
            }).then(({ data, error }) => {
              if (error) {
                toast({
                  title: 'Error',
                  description: error.message,
                  variant: 'destructive',
                });
                setIsConnecting(false);
                return;
              }

              toast({
                title: 'Success',
                description: `Connected to Instagram: @${igAccount.username}`,
              });

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            });
          });
        }
      );
    });
  };

  const postToInstagram = async (accountId: string, message: string, imageUrl: string) => {
    if (!imageUrl) {
      toast({
        title: 'Image Required',
        description: 'Instagram posts require an image',
        variant: 'destructive',
      });
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

      toast({
        title: 'Success',
        description: 'Posted to Instagram successfully!',
      });

      return data;
    } catch (error: any) {
      console.error('Instagram post error:', error);
      toast({
        title: 'Post Failed',
        description: error.message || 'Failed to post to Instagram',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    connectInstagram,
    postToInstagram,
    isConnecting
  };
};
