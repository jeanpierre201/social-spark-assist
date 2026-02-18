
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Manage your team
        </CardTitle>
        <CardDescription>
          Manage campaigns and collaborate with your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Campaign */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Create New Campaign
          </h3>
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
            disabled={createCampaignMutation.isPending}
            className="w-full"
          >
            {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>

        {/* Invite Team Members */}
        {campaigns.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Mail className="h-5 w-5 text-primary" />
              Invite Team Members
            </h3>
            <select
              className="w-full p-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20"
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
              disabled={inviteMemberMutation.isPending}
              className="w-full"
            >
              {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        )}

        {/* Campaigns & Projects Overview */}
        {campaigns.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Your Campaigns & Projects</h3>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold text-foreground">{campaign.name}</h4>
                    {campaign.description && (
                      <p className="text-muted-foreground mt-1">{campaign.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                    <Badge variant="outline">
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Team Members Section */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      Team Members ({campaignMembers.filter(member => member.campaign_id === campaign.id).length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {campaignMembers
                        .filter(member => member.campaign_id === campaign.id)
                        .map((member) => (
                          <div key={member.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mr-3">
                                {(member.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || member.user_id?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {(member.profiles as any)?.full_name || `User ${member.user_id?.slice(0, 8)}`}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {member.role === 'admin' ? (
                                      <Crown className="h-3 w-3 mr-1" />
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pending Invitations Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      Pending Invitations ({campaignInvitations.filter(inv => inv.campaign_id === campaign.id && inv.status === 'pending').length})
                    </h4>
                    {campaignInvitations
                      .filter(invitation => invitation.campaign_id === campaign.id && invitation.status === 'pending')
                      .map((invitation) => (
                        <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg border mb-2">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                            <div>
                              <span className="text-sm font-medium text-foreground">{invitation.email}</span>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  Pending
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
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
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        </div>
                      ))}
                    {campaignInvitations.filter(inv => inv.campaign_id === campaign.id && inv.status === 'pending').length === 0 && (
                      <p className="text-muted-foreground text-sm italic">No pending invitations</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-6">Create your first campaign to start collaborating with your team.</p>
            <Button 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Campaign name"]') as HTMLInputElement;
                input?.focus();
              }}
            >
              Get Started
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamCollaboration;
