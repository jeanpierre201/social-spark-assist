
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCampaigns } from '@/hooks/useCampaigns';

const CampaignForm = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const { createCampaignMutation } = useCampaigns();

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) return;

    createCampaignMutation.mutate({
      name: campaignName.trim(),
      description: campaignDescription.trim() || undefined,
    });

    setCampaignName('');
    setCampaignDescription('');
    setShowCreateDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderPlus className="h-5 w-5 mr-2 text-purple-600" />
          Campaign Management
        </CardTitle>
        <CardDescription>
          Create and manage collaborative campaigns for your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new collaborative campaign or project for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  placeholder="Enter campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="campaignDescription">Description</Label>
                <Textarea
                  id="campaignDescription"
                  placeholder="Describe your campaign goals and objectives"
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
      </CardContent>
    </Card>
  );
};

export default CampaignForm;
