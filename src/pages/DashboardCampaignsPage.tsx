import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Loader2, FolderPlus, Plus, MoreVertical, Pencil, Trash2, Megaphone } from 'lucide-react';
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const RENDER_STYLE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'flat-design', label: 'Flat Design' },
  { value: '3d-render', label: '3D Render' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'abstract-graphic', label: 'Abstract Graphic' },
];

const AESTHETIC_DIRECTION_OPTIONS = [
  { value: 'auto', label: 'Auto Style (Recommended)' },
  { value: 'clean-minimal', label: 'Clean & Minimal' },
  { value: 'bold-impact', label: 'Bold & High Impact' },
  { value: 'corporate', label: 'Corporate & Structured' },
  { value: 'dark-dramatic', label: 'Dark & Dramatic' },
  { value: 'futuristic-tech', label: 'Futuristic & Tech' },
  { value: 'soft-lifestyle', label: 'Soft & Lifestyle' },
  { value: 'editorial-magazine', label: 'Editorial & Magazine' },
  { value: 'playful-colorful', label: 'Playful & Colorful' },
];

const AUDIENCE_TYPE_OPTIONS = [
  { value: 'general', label: 'General Audience' },
  { value: 'young-adults', label: 'Young Adults (18–30)' },
  { value: 'professionals', label: 'Professionals / B2B' },
  { value: 'entrepreneurs', label: 'Entrepreneurs' },
  { value: 'families', label: 'Families & Parents' },
  { value: 'students', label: 'Students' },
  { value: 'luxury', label: 'Luxury Consumers' },
  { value: 'fitness', label: 'Fitness Enthusiasts' },
  { value: 'tech-savvy', label: 'Tech-Savvy Users' },
];

const PLATFORM_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
];

const DashboardCampaignsPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { campaigns, campaignsLoading, createCampaignMutation } = useCampaigns();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [renderStyle, setRenderStyle] = useState('auto');
  const [visualStyle, setVisualStyle] = useState('auto');
  const [audienceType, setAudienceType] = useState('general');
  const [audienceRefinement, setAudienceRefinement] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [styleLock, setStyleLock] = useState(true);

  // Edit state
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editRenderStyle, setEditRenderStyle] = useState('auto');
  const [editVisualStyle, setEditVisualStyle] = useState('auto');
  const [editAudienceType, setEditAudienceType] = useState('general');
  const [editAudienceRefinement, setEditAudienceRefinement] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editIncludeLogo, setEditIncludeLogo] = useState(false);
  const [editStyleLock, setEditStyleLock] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const togglePlatform = (platform: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(platform) ? list.filter(p => p !== platform) : [...list, platform]);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) return;
    try {
      const { error } = await supabase.from('campaigns').insert({
        name: campaignName.trim(),
        description: campaignDescription.trim() || null,
        visual_style: visualStyle,
        audience_type: audienceType,
        audience_refinement: audienceRefinement.trim() || null,
        platforms: selectedPlatforms,
        include_logo: includeLogo,
        style_lock: styleLock,
        created_by: user!.id,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign created!' });
      setCampaignName('');
      setCampaignDescription('');
      setRenderStyle('auto');
      setVisualStyle('auto');
      setAudienceType('general');
      setAudienceRefinement('');
      setSelectedPlatforms([]);
      setIncludeLogo(true);
      setStyleLock(true);
      setShowCreateDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditDescription(campaign.description || '');
    setEditStatus(campaign.status);
    setEditRenderStyle(campaign.render_style || 'auto');
    setEditVisualStyle(campaign.visual_style || 'auto');
    setEditAudienceType(campaign.audience_type || 'general');
    setEditAudienceRefinement(campaign.audience_refinement || '');
    setEditPlatforms(Array.isArray(campaign.platforms) ? campaign.platforms : []);
    setEditIncludeLogo(campaign.include_logo ?? false);
    setEditStyleLock(campaign.style_lock ?? true);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign || !editName.trim()) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          status: editStatus,
          visual_style: editVisualStyle,
          audience_type: editAudienceType,
          audience_refinement: editAudienceRefinement.trim() || null,
          platforms: editPlatforms,
          include_logo: editIncludeLogo,
          style_lock: editStyleLock,
        })
        .eq('id', editingCampaign.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign updated' });
      setShowEditDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Your Campaigns
            </CardTitle>
            <CardDescription>
              Organize content by project, topic, or campaign
            </CardDescription>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Define the creative direction for a series of content.
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
                  <div>
                    <Label>Render Style</Label>
                    <Select value={renderStyle} onValueChange={setRenderStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RENDER_STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">This controls how the image is produced visually.</p>
                  </div>
                  <div>
                    <Label>Aesthetic Direction</Label>
                    <Select value={visualStyle} onValueChange={setVisualStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AESTHETIC_DIRECTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">This controls the mood and composition of the image.</p>
                  </div>
                  <div>
                    <Label htmlFor="audienceType">Audience Type</Label>
                    <Select value={audienceType} onValueChange={setAudienceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Content tone and visuals will adapt to this audience.</p>
                  </div>
                  <div>
                    <Input
                      id="audienceRefinement"
                      placeholder="Add specific audience details"
                      value={audienceRefinement}
                      onChange={(e) => setAudienceRefinement(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label>Platforms</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PLATFORM_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={selectedPlatforms.includes(opt.value)}
                            onCheckedChange={() => togglePlatform(opt.value, selectedPlatforms, setSelectedPlatforms)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">These platforms will be pre-selected in the content creator.</p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label className="text-sm font-medium">Include Logo</Label>
                      <p className="text-xs text-muted-foreground">Add your brand logo to generated images.</p>
                    </div>
                    <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label className="text-sm font-medium">Style Lock</Label>
                      <p className="text-xs text-muted-foreground">Lock audience, platforms & style when using this campaign.</p>
                    </div>
                    <Switch checked={styleLock} onCheckedChange={setStyleLock} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!campaignName.trim()}
                  >
                    Create Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">

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
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[campaign.status] || statusColors.draft}>
                          {campaign.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
          </CardContent>
        </Card>

        {/* Edit Campaign Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>Define the creative direction for a series of content.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Campaign Name *</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Render Style</Label>
                <Select value={editRenderStyle} onValueChange={setEditRenderStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RENDER_STYLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">This controls how the image is produced visually.</p>
              </div>
              <div>
                <Label>Aesthetic Direction</Label>
                <Select value={editVisualStyle} onValueChange={setEditVisualStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AESTHETIC_DIRECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">This controls the mood and composition of the image.</p>
              </div>
              <div>
                <Label htmlFor="editAudienceType">Audience Type</Label>
                <Select value={editAudienceType} onValueChange={setEditAudienceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Content tone and visuals will adapt to this audience.</p>
              </div>
              <div>
                <Input
                  id="editAudienceRefinement"
                  placeholder="Add specific audience details"
                  value={editAudienceRefinement}
                  onChange={(e) => setEditAudienceRefinement(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PLATFORM_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={editPlatforms.includes(opt.value)}
                        onCheckedChange={() => togglePlatform(opt.value, editPlatforms, setEditPlatforms)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">These platforms will be pre-selected in the content creator.</p>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm font-medium">Include Logo</Label>
                  <p className="text-xs text-muted-foreground">Add your brand logo to generated images.</p>
                </div>
                <Switch checked={editIncludeLogo} onCheckedChange={setEditIncludeLogo} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm font-medium">Style Lock</Label>
                  <p className="text-xs text-muted-foreground">Lock audience, platforms & style when using this campaign.</p>
                </div>
                <Switch checked={editStyleLock} onCheckedChange={setEditStyleLock} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardCampaignsPage;
