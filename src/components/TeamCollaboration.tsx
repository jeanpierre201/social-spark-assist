
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Crown, Eye, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCampaigns } from '@/hooks/useCampaigns';

const TeamCollaboration = () => {
  const { toast } = useToast();
  const { 
    campaigns, 
    campaignMembers, 
    campaignInvitations, 
    campaignsLoading,
    createCampaignMutation,
    inviteMemberMutation,
    removeMemberMutation,
  } = useCampaigns();

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
      await createCampaignMutation.mutateAsync({
        name: newCampaignName,
        description: newCampaignDescription || undefined,
      });
      
      setNewCampaignName('');
      setNewCampaignDescription('');
    } catch (error) {
      console.error('Error creating campaign:', error);
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
      await inviteMemberMutation.mutateAsync({
        campaignId: selectedCampaign,
        email: inviteEmail,
        role: 'editor',
      });
      
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      await inviteMemberMutation.mutateAsync({
        campaignId: selectedCampaign,
        email: email,
        role: 'editor',
      });
      
      toast({
        title: "Invitation Resent",
        description: `Invitation has been resent to ${email}`,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (campaignsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading team collaboration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Collaboration</h1>
        <p className="text-gray-600">Manage campaigns and collaborate with your team</p>
      </div>

      {/* Create Campaign */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700">
            <UserPlus className="h-5 w-5 mr-2" />
            Create New Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Campaign name"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            className="border-purple-300 focus:border-purple-500"
          />
          <Input
            placeholder="Campaign description (optional)"
            value={newCampaignDescription}
            onChange={(e) => setNewCampaignDescription(e.target.value)}
            className="border-purple-300 focus:border-purple-500"
          />
          <Button 
            onClick={handleCreateCampaign}
            disabled={createCampaignMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
          </Button>
        </CardContent>
      </Card>

      {/* Invite Team Members */}
      {campaigns.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Mail className="h-5 w-5 mr-2" />
              Invite Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="w-full p-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
              className="border-blue-300 focus:border-blue-500"
            />
            <Button 
              onClick={handleInviteUser}
              disabled={inviteMemberMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaigns & Projects Overview */}
      {campaigns.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-green-700">Your Campaigns & Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-green-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-gray-600 mt-1">{campaign.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Team Members Section */}
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        Team Members ({campaignMembers.filter(member => member.campaign_id === campaign.id).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {campaignMembers
                          .filter(member => member.campaign_id === campaign.id)
                          .map((member) => (
                            <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                  {(member.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || member.user_id?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {(member.profiles as any)?.full_name || `User ${member.user_id?.slice(0, 8)}`}
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <Badge 
                                      variant={member.role === 'admin' ? 'default' : 'secondary'} 
                                      className={`text-xs ${
                                        member.role === 'admin' 
                                          ? 'bg-red-100 text-red-800 border-red-300' 
                                          : member.role === 'editor'
                                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                                          : 'bg-gray-100 text-gray-800 border-gray-300'
                                      }`}
                                    >
                                      {member.role === 'admin' ? (
                                        <Crown className="h-3 w-3 mr-1" />
                                      ) : member.role === 'editor' ? (
                                        <Eye className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Eye className="h-3 w-3 mr-1" />
                                      )}
                                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id, (member.profiles as any)?.full_name || `User ${member.user_id?.slice(0, 8)}`)}
                                disabled={removeMemberMutation.isPending}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Pending Invitations Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-yellow-600" />
                        Pending Invitations ({campaignInvitations.filter(inv => inv.campaign_id === campaign.id && inv.status === 'pending').length})
                      </h4>
                      {campaignInvitations
                        .filter(invitation => invitation.campaign_id === campaign.id && invitation.status === 'pending')
                        .map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-2">
                            <div className="flex items-center">
                              <Mail className="h-5 w-5 text-yellow-600 mr-3" />
                              <div>
                                <span className="text-sm font-medium text-gray-900">{invitation.email}</span>
                                <div className="flex items-center mt-1 space-x-2">
                                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-800">
                                    Pending
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                              disabled={inviteMemberMutation.isPending}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          </div>
                        ))}
                      {campaignInvitations.filter(inv => inv.campaign_id === campaign.id && inv.status === 'pending').length === 0 && (
                        <p className="text-gray-500 text-sm italic">No pending invitations</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">Create your first campaign to start collaborating with your team.</p>
            <Button 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Campaign name"]') as HTMLInputElement;
                input?.focus();
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamCollaboration;
