import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SocialTokens {
  access_token: string | null;
  refresh_token: string | null;
}

/**
 * SECURITY NOTE: This hook has been updated to remove insecure token access.
 * Social media tokens are now handled server-side only for security.
 * Direct token access from the frontend has been removed to prevent token exposure.
 */
export const useSocialTokens = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getTokens = async (accountId: string): Promise<SocialTokens | null> => {
    console.error('Direct token access has been disabled for security reasons');
    toast({
      title: "Security Notice",
      description: "Direct token access is not available for security reasons",
      variant: "destructive",
    });
    return null;
  };

  const updateTokens = async (
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<boolean> => {
    console.error('Direct token updates have been disabled for security reasons');
    toast({
      title: "Security Notice", 
      description: "Direct token updates are not available for security reasons",
      variant: "destructive",
    });
    return false;
  };

  return {
    getTokens,
    updateTokens
  };
};