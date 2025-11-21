import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';

export const FacebookLoginButton = () => {
  const { handleFacebookCallback } = useFacebookAuth();

  useEffect(() => {
    // Set up the global callback function for Facebook Login Button
    (window as any).checkLoginState = function() {
      console.log('Checking Facebook login state...');
      
      if (!window.FB) {
        console.error('Facebook SDK not loaded');
        return;
      }

      window.FB.getLoginStatus(function(response: any) {
        console.log('Facebook login status response:', response);
        
        if (response.status === 'connected') {
          // User is logged in and authorized
          handleFacebookCallback(response);
        } else {
          console.log('User is not connected or not authorized');
        }
      });
    };

    // Parse Facebook XFBML elements (login button)
    if (window.FB) {
      window.FB.XFBML.parse();
    }

    // Cleanup
    return () => {
      delete (window as any).checkLoginState;
    };
  }, [handleFacebookCallback]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Facebook Page</CardTitle>
        <CardDescription>
          Connect your Facebook Page to start posting content automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the button below to connect your Facebook Page. You'll need to:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Log in to Facebook (if not already logged in)</li>
            <li>Grant permissions for your Facebook Page</li>
            <li>Select which page to connect</li>
          </ul>
          
          {/* Facebook Login Button */}
          <div 
            className="fb-login-button" 
            data-width="400"
            data-size="large"
            data-button-type="continue_with"
            data-layout="default"
            data-auto-logout-link="false"
            data-use-continue-as="true"
            data-scope="pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups"
            data-onlogin="checkLoginState()"
          ></div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By connecting, you agree to allow RombiPost to post on behalf of your Facebook Page
          </p>
        </div>
      </CardContent>
    </Card>
  );
};