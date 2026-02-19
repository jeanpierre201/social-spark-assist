import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useBrand } from '@/hooks/useBrand';
import { Loader2, Upload, Building2, Paintbrush, ImageIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const voiceTones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'bold', label: 'Bold & Confident' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'educational', label: 'Educational' },
  { value: 'luxury', label: 'Luxury & Premium' },
];

const visualStyles = [
  { value: 'clean-minimal', label: 'Clean & minimal' },
  { value: 'modern-gradient', label: 'Modern gradient' },
  { value: 'flat-design', label: 'Flat design' },
  { value: '3d-render', label: '3D render' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'social-media-bold', label: 'Social media bold' },
];

const logoPositions = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const DashboardBrandPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { brand, isLoading: brandLoading, upsertBrand, isSaving } = useBrand();
  const { toast } = useToast();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [voiceTone, setVoiceTone] = useState('professional');
  const [visualStyle, setVisualStyle] = useState('clean-minimal');
  const [colorPrimary, setColorPrimary] = useState('#3b82f6');
  const [colorSecondary, setColorSecondary] = useState('#8b5cf6');
  const [brandColorEnabled, setBrandColorEnabled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPlacement, setLogoPlacement] = useState('none');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name || '');
      setTagline(brand.tagline || '');
      setDescription(brand.description || '');
      setVoiceTone(brand.voice_tone || 'professional');
      setVisualStyle(brand.visual_style || 'clean-minimal');
      setColorPrimary(brand.color_primary || '#3b82f6');
      setColorSecondary(brand.color_secondary || '#8b5cf6');
      setBrandColorEnabled(!!(brand.color_primary || brand.color_secondary));
      setLogoUrl(brand.logo_url || null);
      setLogoPlacement(brand.logo_placement || 'none');
      setWatermarkEnabled(brand.watermark_enabled || false);
      setWatermarkOpacity(brand.watermark_opacity != null ? Math.round(brand.watermark_opacity * 100) : 50);
    }
  }, [brand]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/brand-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setLogoUrl(urlData.publicUrl);
      toast({ title: 'Logo uploaded', description: 'Your brand logo has been uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a brand name.', variant: 'destructive' });
      return;
    }
    upsertBrand({
      name: name.trim(),
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      logo_url: logoUrl,
      voice_tone: voiceTone,
      visual_style: visualStyle,
      color_primary: brandColorEnabled ? colorPrimary : null,
      color_secondary: brandColorEnabled ? colorSecondary : null,
      logo_placement: logoPlacement,
      watermark_enabled: logoPlacement !== 'none' ? watermarkEnabled : false,
      watermark_opacity: logoPlacement !== 'none' && watermarkEnabled ? watermarkOpacity / 100 : 0.5,
    } as any);
  };

  if (loading || brandLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Brand Profile" />
        <ProDashboardNav />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brand Identity */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Brand Identity
                </CardTitle>
                <CardDescription>
                  Define your corporate identity. This will be used to generate consistent branded content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    placeholder="Your company or brand name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A short memorable phrase (e.g., 'Just Do It')"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Brand Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your brand's mission, values, and what makes you unique..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="voiceTone">Brand Voice & Tone</Label>
                  <Select value={voiceTone} onValueChange={setVoiceTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceTones.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logo & Brand Style Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Brand Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {logoUrl ? (
                  <div>
                    <img
                      src={logoUrl}
                      alt="Brand logo"
                      className="w-full h-40 object-contain rounded-lg border border-border bg-muted p-2"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Label htmlFor="logoUpload" className="cursor-pointer">
                        <Button variant="outline" size="sm" className="w-full" disabled={uploading} asChild>
                          <span>
                            {uploading ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                            ) : (
                              'Change File'
                            )}
                          </span>
                        </Button>
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogoUrl(null)}
                      >
                        Remove Logo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload your logo</p>
                    </div>
                    <Label htmlFor="logoUpload" className="cursor-pointer">
                      <Button variant="outline" className="w-full mt-2" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                          ) : (
                            'Choose File'
                          )}
                        </span>
                      </Button>
                    </Label>
                  </div>
                )}
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />

                {/* Logo Placement */}
                <div>
                  <Label htmlFor="logoPlacement">Logo Placement</Label>
                  <Select value={logoPlacement} onValueChange={setLogoPlacement}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Do not include</SelectItem>
                      {logoPositions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Watermark Toggle - only when placement selected */}
                {logoPlacement !== 'none' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="watermarkEnabled"
                        checked={watermarkEnabled}
                        onCheckedChange={(checked) => setWatermarkEnabled(checked === true)}
                      />
                      <Label htmlFor="watermarkEnabled" className="cursor-pointer">Watermark style (semi-transparent)</Label>
                    </div>
                    {watermarkEnabled && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Opacity</Label>
                          <span className="text-sm text-muted-foreground">{watermarkOpacity}%</span>
                        </div>
                        <Slider
                          value={[watermarkOpacity]}
                          onValueChange={(value) => setWatermarkOpacity(value[0])}
                          min={10}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brand Style Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="h-5 w-5 text-primary" />
                  Brand Style
                </CardTitle>
                <CardDescription>
                  Set your brand style for visual consistency across content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="visualStyle">Visual Style</Label>
                  <Select value={visualStyle} onValueChange={setVisualStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visualStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="brandColorEnabled"
                    checked={brandColorEnabled}
                    onCheckedChange={(checked) => setBrandColorEnabled(checked === true)}
                  />
                  <Label htmlFor="brandColorEnabled" className="cursor-pointer">Brand Color</Label>
                </div>

                {brandColorEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="colorPrimary">Primary Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            id="colorPrimary"
                            value={colorPrimary}
                            onChange={(e) => setColorPrimary(e.target.value)}
                            className="h-10 w-14 rounded border border-input cursor-pointer"
                          />
                          <Input
                            value={colorPrimary}
                            onChange={(e) => setColorPrimary(e.target.value)}
                            className="flex-1"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="colorSecondary">Secondary Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            id="colorSecondary"
                            value={colorSecondary}
                            onChange={(e) => setColorSecondary(e.target.value)}
                            className="h-10 w-14 rounded border border-input cursor-pointer"
                          />
                          <Input
                            value={colorSecondary}
                            onChange={(e) => setColorSecondary(e.target.value)}
                            className="flex-1"
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div
                        className="h-16 flex-1 rounded-lg border border-border flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: colorPrimary, color: '#fff' }}
                      >
                        Primary
                      </div>
                      <div
                        className="h-16 flex-1 rounded-lg border border-border flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: colorSecondary, color: '#fff' }}
                      >
                        Secondary
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brand Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border p-4 space-y-3">
                  {logoUrl && (
                    <img src={logoUrl} alt="" className="h-10 object-contain" />
                  )}
                  <h3 className="font-bold text-foreground">{name || 'Your Brand'}</h3>
                  {tagline && <p className="text-sm text-muted-foreground italic">{tagline}</p>}
                  {description && <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>}
                  <div className="flex gap-2 items-center">
                    {brandColorEnabled && (
                      <>
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: colorPrimary }}
                        />
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: colorSecondary }}
                        />
                      </>
                    )}
                    <span className="text-xs text-muted-foreground capitalize">{voiceTone} tone</span>
                    <span className="text-xs text-muted-foreground">· {visualStyles.find(s => s.value === visualStyle)?.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : brand ? (
                'Update Brand'
              ) : (
                'Create Brand'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBrandPage;
