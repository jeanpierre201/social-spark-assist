
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Mail, 
  MoreVertical,
  Shield,
  Edit,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCampaigns } from '@/hooks/useCampaigns';
import CampaignForm from '@/components/team/CampaignForm';

const TeamCollaboration = () => {
  const { toast } = useToast();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'editor' | 'viewer'>('editor');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const {
    campaigns,
    campaignMembers,
    campaignInvitations,
    campaignsLoading,
    inviteMemberMutation,
    removeMemberMutation,
    updateMemberRoleMutation,
  } = useCampaigns();

  console.log('TeamCollaboration render:', {
    campaignsLoading,
    campaignsCount: campaigns.length,
    membersCount: campaignMembers.length,
    invitationsCount: campaignInvitations.length
  });

  const handleInviteMember = () => {
    if (!newMemberEmail || !selectedCampaignId) {
      toast({
        title: "Missing Information",
        description: "Please select a campaign and enter an email address",
        variant: "destructive",
      });
      return;
    }

    inviteMemberMutation.mutate({
      campaignId: selectedCampaignId,
      email: newMemberEmail,
      role: newMemberRole,
    });

    setNewMemberEmail('');
    setNewMemberRole('editor');
    setSelectedCampaignId('');
    setShowInviteDialog(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get members for each campaign
  const getCampaignMembers = (campaignId: string) => {
    return campaignMembers.filter(member => member.campaign_id === campaignId);
  };

  if (campaignsLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Team Collaboration
              <Badge className="ml-2 bg-purple-100 text-purple-800">Pro</Badge>
            </CardTitle>
            <CardDescription className="text-purple-700">
              Collaborate with your team on content creation and social media management
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading team collaboration data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Collaboration Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Team Collaboration
            <Badge className="ml-2 bg-purple-100 text-purple-800">Pro</Badge>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Collaborate with your team on content creation and social media management
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Campaign Creation Form */}
      <CampaignForm />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Team Members ({campaignMembers.length})
              </CardTitle>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to collaborate on your campaign.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaign">Select Campaign</Label>
                      <select
                        id="campaign"
                        className="w-full p-2 border rounded"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                      >
                        <option value="">Select a campaign</option>
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        className="w-full p-2 border rounded"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as 'editor' | 'viewer')}
                      >
                        <option value="editor">Editor - Can create and edit content</option>
                        <option value="viewer">Viewer - Can view and comment only</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleInviteMember}
                      disabled={inviteMemberMutation.isPending}
                    >
                      {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage your team members and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaignMembers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  No team members yet. Create a campaign and invite collaborators.
                </div>
              ) : (
                campaignMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.profiles?.full_name ? 
                            member.profiles.full_name.split(' ').map(n => n[0]).join('') :
                            member.user_id.slice(0, 2).toUpperCase()
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.profiles?.full_name || 'Team Member'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Campaign: {campaigns.find(c => c.id === member.campaign_id)?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                        {member.role === 'editor' && <Edit className="h-3 w-3 mr-1" />}
                        {member.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                        {member.role}
                      </Badge>
                      <Badge className={getStatusColor('active')}>
                        active
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => updateMemberRoleMutation.mutate({
                              memberId: member.id,
                              role: member.role === 'admin' ? 'editor' : 'admin'
                            })}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collaborative Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Active Campaigns ({campaigns.length})
            </CardTitle>
            <CardDescription>Your collaborative campaigns and projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  No campaigns yet. Create your first campaign to get started.
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const members = getCampaignMembers(campaign.id);
                  return (
                    <div key={campaign.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge className={getCampaignStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{campaign.description || 'No description'}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                        <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {campaignInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-purple-600" />
              Pending Invitations ({campaignInvitations.filter(inv => inv.status === 'pending').length})
            </CardTitle>
            <CardDescription>Track your sent team invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaignInvitations
                .filter(invitation => invitation.status === 'pending')
                .map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-500">
                        Campaign: {campaigns.find(c => c.id === invitation.campaign_id)?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(invitation.role)}>
                        {invitation.role}
                      </Badge>
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamCollaboration;
