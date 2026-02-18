import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useBrand } from '@/hooks/useBrand';
import { Loader2, Building2, Upload, Palette, Sparkles } from 'lucide-react';
import { extractColorsFromImage } from '@/utils/colorExtractor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [colorPrimary, setColorPrimary] = useState('#3b82f6');
  const [colorSecondary, setColorSecondary] = useState('#8b5cf6');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name || '');
      setTagline(brand.tagline || '');
      setDescription(brand.description || '');
      setVoiceTone(brand.voice_tone || 'professional');
      setColorPrimary(brand.color_primary || '#3b82f6');
      setColorSecondary(brand.color_secondary || '#8b5cf6');
      setLogoUrl(brand.logo_url || null);
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

      const publicUrl = urlData.publicUrl;
      setLogoUrl(publicUrl);

      // Auto-extract colors
      setExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(publicUrl);
        setColorPrimary(colors.primary);
        setColorSecondary(colors.secondary);
        toast({ title: 'Logo uploaded', description: 'Colors extracted from your logo. You can adjust them manually.' });
      } catch {
        toast({ title: 'Logo uploaded', description: 'Could not extract colors automatically. Set them manually.' });
      } finally {
        setExtractingColors(false);
      }
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
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
    });
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Brand Colors
                </CardTitle>
                <CardDescription>
                  Set your brand colors for visual consistency across content.
                  {extractingColors && (
                    <span className="flex items-center gap-1 text-primary mt-1">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Extracting colors from logo...
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                {/* Color Preview */}
                <div className="mt-4 flex gap-3">
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
              </CardContent>
            </Card>
          </div>

          {/* Logo & Preview Sidebar */}
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
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Brand logo"
                      className="w-full h-40 object-contain rounded-lg border border-border bg-muted p-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setLogoUrl(null)}
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload your logo</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="logoUpload" className="cursor-pointer">
                    <Button variant="outline" className="w-full" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          'Choose File'
                        )}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
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
                  <div className="flex gap-2">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: colorPrimary }}
                    />
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: colorSecondary }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{voiceTone} tone</span>
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
