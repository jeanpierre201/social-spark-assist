
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CampaignMember, CampaignInvitation } from '@/types/campaign';

// Define the campaign type locally to avoid circular dependencies
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'draft' | 'completed' | 'archived';
}

export const useCampaignQueries = () => {
  const { user } = useAuth();

  // Fetch user's campaigns
  const { data: campaigns = [], isLoading: campaignsLoading, error: campaignsError } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching campaigns for user:', user.id);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
      
      console.log('Campaigns fetched:', data);
      return (data || []) as Campaign[];
    },
    enabled: !!user,
  });

  // Fetch campaign members - only for campaigns the user created
  const { data: campaignMembers = [], error: membersError } = useQuery({
    queryKey: ['campaign-members', user?.id],
    queryFn: async () => {
      if (!user || campaigns.length === 0) return [];
      
      console.log('Fetching campaign members for campaigns:', campaigns.map(c => c.id));
      
      const campaignIds = campaigns.map(c => c.id);
      
      const { data, error } = await supabase
        .from('campaign_members')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('joined_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaign members:', error);
        throw error;
      }
      
      console.log('Campaign members fetched:', data);
      
      // Transform the data to match our expected type
      return (data || []).map(member => ({
        ...member,
        profiles: null // Set to null since we're not joining with profiles for now
      })) as CampaignMember[];
    },
    enabled: !!user && campaigns.length > 0,
  });

  // Fetch campaign invitations - only for campaigns the user created
  const { data: campaignInvitations = [], error: invitationsError } = useQuery({
    queryKey: ['campaign-invitations', user?.id],
    queryFn: async () => {
      if (!user || campaigns.length === 0) return [];
      
      console.log('Fetching campaign invitations for campaigns:', campaigns.map(c => c.id));
      
      const campaignIds = campaigns.map(c => c.id);
      
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('invited_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaign invitations:', error);
        throw error;
      }
      
      console.log('Campaign invitations fetched:', data);
      return (data || []) as CampaignInvitation[];
    },
    enabled: !!user && campaigns.length > 0,
  });

  // Log any errors for debugging
  if (campaignsError) console.error('Campaigns query error:', campaignsError);
  if (membersError) console.error('Members query error:', membersError);
  if (invitationsError) console.error('Invitations query error:', invitationsError);

  return {
    campaigns,
    campaignMembers,
    campaignInvitations,
    campaignsLoading,
  };
};
