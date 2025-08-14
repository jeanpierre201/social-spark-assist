import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SocialTokens {
  access_token: string | null;
  refresh_token: string | null;
}

/**
 * Secure hook for accessing social media tokens
 * This should only be used when absolutely necessary for API calls
 */
export const useSocialTokens = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getTokens = async (accountId: string): Promise<SocialTokens | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_social_account_tokens', {
        account_id: accountId
      });

      if (error) {
        console.error('Error fetching tokens:', error);
        toast({
          title: "Error",
          description: "Failed to access social media tokens",
          variant: "destructive",
        });
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getTokens:', error);
      toast({
        title: "Error",
        description: "Failed to access social media tokens",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTokens = async (
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<boolean> => {
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('update_social_account_tokens', {
        account_id: accountId,
        new_access_token: accessToken,
        new_refresh_token: refreshToken || null,
        new_expires_at: expiresAt?.toISOString() || null
      });

      if (error) {
        console.error('Error updating tokens:', error);
        toast({
          title: "Error",
          description: "Failed to update social media tokens",
          variant: "destructive",
        });
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in updateTokens:', error);
      toast({
        title: "Error",
        description: "Failed to update social media tokens",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    getTokens,
    updateTokens
  };
};