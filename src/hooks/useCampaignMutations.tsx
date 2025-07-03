
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useCampaignMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign: { name: string; description?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('campaigns')
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
        .from('campaign_members')
        .select('id', { count: 'exact' })
        .eq('campaign_id', campaignId);
      
      if (memberCount && memberCount.length >= 5) {
        throw new Error('Maximum 5 collaborators allowed per campaign');
      }
      
      // Get campaign details for the email
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();

      // Get user profile for inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      // Create the invitation record
      const { data, error } = await supabase
        .from('campaign_invitations')
        .insert({
          campaign_id: campaignId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-campaign-invitation', {
        body: {
          email,
          campaignName: campaign?.name || 'Campaign',
          inviterName: profile?.full_name || 'Team member',
          role,
          invitationId: data.id,
        },
      });

      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't throw error here - invitation was created successfully
        // We just log the email failure
      }
      
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
        .from('campaign_members')
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
        .from('campaign_members')
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
    createCampaignMutation,
    inviteMemberMutation,
    removeMemberMutation,
    updateMemberRoleMutation,
  };
};
