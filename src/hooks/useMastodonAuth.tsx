import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMastodonAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectMastodon = async () => {
    setIsConnecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('You must be logged in to connect Mastodon');
      }

      const { data, error } = await supabase.functions.invoke('mastodon-verify', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect Mastodon');
      }

      if (data?.success) {
        toast({
          title: 'Mastodon Connected',
          description: `Connected as @${data.account.username}`,
        });
        return { success: true, account: data.account };
      } else {
        throw new Error(data?.error || 'Failed to verify Mastodon credentials');
      }
    } catch (error: any) {
      console.error('Mastodon connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Mastodon account',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectMastodon = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', 'mastodon');

      if (error) {
        throw error;
      }

      toast({
        title: 'Mastodon Disconnected',
        description: 'Your Mastodon account has been disconnected.',
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Mastodon disconnect error:', error);
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect Mastodon account',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  return {
    connectMastodon,
    disconnectMastodon,
    isConnecting,
  };
};
