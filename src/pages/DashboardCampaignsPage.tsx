import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Loader2, FolderPlus, Plus, MoreVertical, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';

const DashboardCampaignsPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { campaigns, campaignsLoading, createCampaignMutation } = useCampaigns();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) return;
    createCampaignMutation.mutate(
      { name: campaignName.trim(), description: campaignDescription.trim() || undefined },
      {
        onSuccess: () => {
          setCampaignName('');
          setCampaignDescription('');
          setShowCreateDialog(false);
        },
      }
    );
  };

  if (loading || campaignsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isProUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} />
          <UpgradePrompt />
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-muted text-muted-foreground',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Campaigns" />
        <ProDashboardNav />

        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
              <p className="text-sm text-muted-foreground">Organize content by project, topic, or campaign</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Organize your content around a specific project or theme.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Summer Launch, Q1 Blog Series"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaignDescription">Description</Label>
                    <Textarea
                      id="campaignDescription"
                      placeholder="What is this campaign about?"
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!campaignName.trim() || createCampaignMutation.isPending}
                  >
                    {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first campaign to organize content by project or theme.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <Badge className={statusColors[campaign.status] || statusColors.draft}>
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <CardDescription className="line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCampaignsPage;
