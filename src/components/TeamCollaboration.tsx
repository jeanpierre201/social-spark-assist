
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar';
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
  MessageSquare,
  Calendar,
  CheckCircle
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  collaborators: number;
  lastUpdated: string;
  status: 'active' | 'draft' | 'completed';
}

const TeamCollaboration = () => {
  const { toast } = useToast();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'editor' | 'viewer'>('editor');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Mock data - in real app this would come from API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      role: 'editor',
      status: 'active',
      joinedAt: '2024-02-10',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'viewer',
      status: 'pending',
      joinedAt: '2024-03-01',
    },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Q2 Social Media Campaign',
      description: 'Instagram and LinkedIn content for product launch',
      collaborators: 3,
      lastUpdated: '2024-03-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Brand Awareness Content',
      description: 'Educational content series for all platforms',
      collaborators: 2,
      lastUpdated: '2024-03-10',
      status: 'draft',
    },
  ]);

  const handleInviteMember = () => {
    if (!newMemberEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the invitation",
        variant: "destructive",
      });
      return;
    }

    // Mock invitation - in real app this would call API
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail,
      role: newMemberRole,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setTeamMembers([...teamMembers, newMember]);
    setNewMemberEmail('');
    setNewMemberRole('editor');
    setShowInviteDialog(false);

    toast({
      title: "Invitation Sent",
      description: `Team invitation sent to ${newMemberEmail}`,
    });
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

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Team Members ({teamMembers.length})
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
                      Send an invitation to collaborate on your social media content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
                    <Button onClick={handleInviteMember}>Send Invitation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage your team members and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                      {member.role === 'editor' && <Edit className="h-3 w-3 mr-1" />}
                      {member.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                      {member.role}
                    </Badge>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collaborative Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Collaborative Projects ({projects.length})
            </CardTitle>
            <CardDescription>Shared content projects and campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge className={getProjectStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {project.collaborators} collaborators
                    </span>
                    <span>Updated {project.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <UserPlus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest team collaboration activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sarah Wilson completed content review</p>
                <p className="text-xs text-gray-500">Q2 Social Media Campaign • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
              <Edit className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Mike Johnson added new content variations</p>
                <p className="text-xs text-gray-500">Brand Awareness Content • 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border-l-4 border-purple-500 bg-purple-50">
              <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">John Doe scheduled 5 posts for next week</p>
                <p className="text-xs text-gray-500">Q2 Social Media Campaign • 6 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <UserPlus className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">New team member invitation sent</p>
                <p className="text-xs text-gray-500">alex@company.com • 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCollaboration;
