
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Crown, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCampaignQueries } from '@/hooks/useCampaignQueries';
import { useCampaignMutations } from '@/hooks/useCampaignMutations';

const TeamCollaboration = () => {
  const { toast } = useToast();
  const { 
    campaigns, 
    campaignMembers, 
    campaignInvitations, 
    isLoading 
  } = useCampaignQueries();
  
  const {
    createCampaign,
    inviteUser,
    removeMember,
    deleteInvitation,
    isCreating,
    isInviting,
    isRemoving,
    isDeleting
  } = useCampaignMutations();

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCampaign({
        name: newCampaignName,
        description: newCampaignDescription || null,
      });
      
      setNewCampaignName('');
      setNewCampaignDescription('');
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedCampaign) {
      toast({
        title: "Error",
        description: "Email and campaign selection are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteUser({
        campaign_id: selectedCampaign,
        email: inviteEmail,
      });
      
      setInviteEmail('');
      
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    try {
      await removeMember(memberId);
      toast({
        title: "Success",
        description: `Removed ${memberEmail} from campaign`,
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation(invitationId);
      toast({
        title: "Success",
        description: "Invitation cancelled",
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading team collaboration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Collaboration</h1>
        <p className="text-gray-600">Manage campaigns and collaborate with your team</p>
      </div>

      {/* Create Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Create New Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Campaign name"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
          />
          <Input
            placeholder="Campaign description (optional)"
            value={newCampaignDescription}
            onChange={(e) => setNewCampaignDescription(e.target.value)}
          />
          <Button 
            onClick={handleCreateCampaign}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Campaign'}
          </Button>
        </CardContent>
      </Card>

      {/* Invite Team Members */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Invite Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="w-full p-2 border rounded"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="">Select a campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <Input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button 
              onClick={handleInviteUser}
              disabled={isInviting}
              className="w-full"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge variant="secondary">
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                  </div>
                  {campaign.description && (
                    <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                  )}
                  
                  {/* Campaign Members */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Team Members:</h4>
                    {campaignMembers
                      .filter(member => member.campaign_id === campaign.id)
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {member.user_id?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">User {member.user_id?.slice(0, 8)}</p>
                              <Badge variant="outline" className="text-xs">
                                {member.role === 'admin' ? <Crown className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, `User ${member.user_id?.slice(0, 8)}`)}
                            disabled={isRemoving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>

                  {/* Pending Invitations */}
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-sm">Pending Invitations:</h4>
                    {campaignInvitations
                      .filter(invitation => invitation.campaign_id === campaign.id && invitation.status === 'pending')
                      .map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm">{invitation.email}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Pending
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600">Create your first campaign to start collaborating with your team.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamCollaboration;
