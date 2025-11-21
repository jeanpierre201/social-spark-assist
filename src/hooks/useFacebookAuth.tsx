import { useState } from 'react';
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

  const connectFacebook = async () => {
    setIsConnecting(true);

    try {
      // Check if FB SDK is loaded
      if (!window.FB) {
        throw new Error('Facebook SDK not loaded');
      }

      // Login to Facebook
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            
            console.log('Facebook login successful, getting pages...');

            // Get user's pages
            window.FB.api('/me/accounts', (pagesResponse: any) => {
              if (pagesResponse.error) {
                toast({
                  title: 'Error',
                  description: pagesResponse.error.message,
                  variant: 'destructive',
                });
                setIsConnecting(false);
                return;
              }

              if (!pagesResponse.data || pagesResponse.data.length === 0) {
                toast({
                  title: 'No Pages Found',
                  description: 'You need to have a Facebook Page to connect. Please create one first.',
                  variant: 'destructive',
                });
                setIsConnecting(false);
                return;
              }

              // Use the first page (you can add page selection UI later)
              const page = pagesResponse.data[0];
              const pageAccessToken = page.access_token;

              console.log('Using page:', page.name);

              // Call our backend to store the connection
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

                supabase.functions.invoke('facebook-oauth', {
                  body: {
                    accessToken: pageAccessToken,
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
                    description: `Connected to Facebook Page: ${page.name}`,
                  });

                  // Refresh the page to update the UI
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                });
              });
            });
          } else {
            toast({
              title: 'Connection Cancelled',
              description: 'Facebook connection was cancelled',
              variant: 'destructive',
            });
            setIsConnecting(false);
          }
        },
        { 
          scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups',
          return_scopes: true 
        }
      );
    } catch (error: any) {
      console.error('Facebook connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Facebook',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
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