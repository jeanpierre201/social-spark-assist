
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCampaignQueries = () => {
  const { user } = useAuth();

  // Fetch campaigns created by the current user
  const campaignQuery = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch campaign members for user's campaigns
  const campaignMembersQuery = useQuery({
    queryKey: ['campaign-members', user?.id],
    queryFn: async () => {
      if (!user || !campaignQuery.data?.length) return [];
      
      const campaignIds = campaignQuery.data.map(c => c.id);
      
      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name
          )
        `)
        .in('campaign_id', campaignIds)
        .order('joined_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaign members:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!campaignQuery.data?.length,
  });

  // Fetch campaign invitations
  const campaignInvitationsQuery = useQuery({
    queryKey: ['campaign-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .eq('invited_by', user.id)
        .order('invited_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaign invitations:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  return {
    campaigns: campaignQuery.data || [],
    campaignMembers: campaignMembersQuery.data || [],
    campaignInvitations: campaignInvitationsQuery.data || [],
    campaignsLoading: campaignQuery.isLoading,
    membersLoading: campaignMembersQuery.isLoading,
    invitationsLoading: campaignInvitationsQuery.isLoading,
    isLoading: campaignQuery.isLoading || campaignMembersQuery.isLoading || campaignInvitationsQuery.isLoading,
  };
};
