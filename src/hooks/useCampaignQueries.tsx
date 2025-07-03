
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Campaign, CampaignMember, CampaignInvitation } from '@/types/campaign';

export const useCampaignQueries = () => {
  const { user } = useAuth();

  // Fetch user's campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Campaign[];
    },
    enabled: !!user,
  });

  // Fetch campaign members
  const { data: campaignMembers = [] } = useQuery({
    queryKey: ['campaign-members', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as CampaignMember[];
    },
    enabled: !!user,
  });

  // Fetch campaign invitations
  const { data: campaignInvitations = [] } = useQuery({
    queryKey: ['campaign-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .order('invited_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as CampaignInvitation[];
    },
    enabled: !!user,
  });

  return {
    campaigns,
    campaignMembers,
    campaignInvitations,
    campaignsLoading,
  };
};
