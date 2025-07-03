
import { useCampaignQueries } from './useCampaignQueries';
import { useCampaignMutations } from './useCampaignMutations';

export const useCampaigns = () => {
  const { campaigns, campaignMembers, campaignInvitations, campaignsLoading } = useCampaignQueries();
  const { 
    createCampaignMutation, 
    inviteMemberMutation, 
    removeMemberMutation, 
    updateMemberRoleMutation 
  } = useCampaignMutations();

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

// Re-export types for convenience
export type { Campaign, CampaignMember, CampaignInvitation } from '@/types/campaign';
