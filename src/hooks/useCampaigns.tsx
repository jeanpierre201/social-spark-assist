
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'draft' | 'completed' | 'archived';
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  joined_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CampaignInvitation {
  id: string;
  campaign_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export const useCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaigns' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Campaign[];
    },
    enabled: !!user,
  });

  // Fetch campaign members
  const { data: campaignMembers = [] } = useQuery({
    queryKey: ['campaign-members', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaign_members' as any)
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as CampaignMember[];
    },
    enabled: !!user,
  });

  // Fetch campaign invitations
  const { data: campaignInvitations = [] } = useQuery({
    queryKey: ['campaign-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('campaign_invitations' as any)
        .select('*')
        .order('invited_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as CampaignInvitation[];
    },
    enabled: !!user,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign: { name: string; description?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('campaigns' as any)
        .insert({
          name: newCampaign.name,
          description: newCampaign.description || null,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-members'] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
      console.error('Create campaign error:', error);
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ 
      campaignId, 
      email, 
      role 
    }: { 
      campaignId: string; 
      email: string; 
      role: 'editor' | 'viewer' 
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if user can add more members using direct SQL query
      const { data: memberCount } = await supabase
        .from('campaign_members' as any)
        .select('id', { count: 'exact' })
        .eq('campaign_id', campaignId);
      
      if (memberCount && memberCount.length >= 5) {
        throw new Error('Maximum 5 collaborators allowed per campaign');
      }
      
      const { data, error } = await supabase
        .from('campaign_invitations' as any)
        .insert({
          campaign_id: campaignId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-invitations'] });
      toast({
        title: "Invitation Sent",
        description: "Team invitation has been sent successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      console.error('Invite member error:', error);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('campaign_members' as any)
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-members'] });
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
      console.error('Remove member error:', error);
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ 
      memberId, 
      role 
    }: { 
      memberId: string; 
      role: 'admin' | 'editor' | 'viewer' 
    }) => {
      const { error } = await supabase
        .from('campaign_members' as any)
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-members'] });
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
      console.error('Update member role error:', error);
    },
  });

  return {
    campaigns,
    campaignMembers,
    campaignInvitations,
    campaignsLoading,
    createCampaignMutation,
    inviteMemberMutation,
    removeMemberMutation,
    updateMemberRoleMutation,
  };
};
