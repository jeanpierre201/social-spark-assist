
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SocialAccount {
  id: string;
  platform: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
}

interface SocialMetrics {
  platform: string;
  followers_count: number;
  engagement_rate: number;
  posts_count: number;
  scheduled_posts_count: number;
}

interface SocialAccountsContextType {
  accounts: SocialAccount[];
  metrics: SocialMetrics[];
  loading: boolean;
  connectAccount: (platform: string) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

const SocialAccountsContext = createContext<SocialAccountsContextType | undefined>(undefined);

export const SocialAccountsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [metrics, setMetrics] = useState<SocialMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, platform, username, is_active, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load social media accounts",
        variant: "destructive",
      });
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_latest_metrics', {
        user_uuid: user.id
      });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching social metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load social media metrics",
        variant: "destructive",
      });
    }
  };

  const connectAccount = async (platform: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: platform as any,
        options: {
          scopes: getOAuthScopes(platform),
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Connecting to ${platform}...`,
      });
    } catch (error) {
      console.error('Error connecting account:', error);
      toast({
        title: "Error",
        description: `Failed to connect ${platform} account`,
        variant: "destructive",
      });
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      await fetchAccounts();
      toast({
        title: "Success",
        description: "Social media account disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  const refreshMetrics = async () => {
    await fetchMetrics();
    toast({
      title: "Refreshed",
      description: "Social media metrics updated",
    });
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchAccounts(), fetchMetrics()]).finally(() => {
        setLoading(false);
      });
    } else {
      setAccounts([]);
      setMetrics([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <SocialAccountsContext.Provider value={{
      accounts,
      metrics,
      loading,
      connectAccount,
      disconnectAccount,
      refreshMetrics
    }}>
      {children}
    </SocialAccountsContext.Provider>
  );
};

export const useSocialAccounts = () => {
  const context = useContext(SocialAccountsContext);
  if (context === undefined) {
    throw new Error('useSocialAccounts must be used within a SocialAccountsProvider');
  }
  return context;
};

const getOAuthScopes = (platform: string): string => {
  const scopes = {
    instagram: 'user_profile,user_media',
    twitter: 'users.read,tweet.read,offline.access',
    facebook: 'pages_show_list,pages_read_engagement',
    linkedin: 'r_liteprofile,r_emailaddress,w_member_social'
  };
  return scopes[platform as keyof typeof scopes] || '';
};
