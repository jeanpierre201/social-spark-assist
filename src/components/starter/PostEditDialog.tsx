import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Save, Eye, ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  industry: string;
  goal: string;
  niche_info: string | null;
  generated_caption: string;
  generated_hashtags: string[];
  media_url: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  social_platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  created_at: string;
  posted_at: string | null;
}

interface PostEditDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
}

const PostEditDialog = ({ post, open, onOpenChange, onPostUpdated }: PostEditDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscriptionEnd } = useSubscription();
  const { accounts } = useSocialAccounts();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    scheduled_date: '',
    scheduled_time: '',
    social_platforms: [] as string[],
    status: 'draft' as 'draft' | 'scheduled' | 'published' | 'archived',
    media_url: ''
  });

  const socialPlatforms = [
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'X (Twitter)' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'snapchat', name: 'Snapchat' }
  ];

  const isEditable = post?.status === 'draft' || post?.status === 'scheduled';
  const isReadOnly = !isEditable;

  // Calculate the maximum allowed scheduling date
  const getMaxScheduleDate = () => {
    if (!post) return format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    const today = new Date();
    const postCreationDate = new Date(post.created_at);
    
    // Calculate limits
    const thirtyDaysFromCreation = new Date(postCreationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromToday = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let maxDate = new Date(Math.min(thirtyDaysFromCreation.getTime(), thirtyDaysFromToday.getTime()));
    
    // If subscription has an end date, use that as an additional limit
    if (subscriptionEnd) {
      const subscriptionEndDate = new Date(subscriptionEnd);
      maxDate = new Date(Math.min(maxDate.getTime(), subscriptionEndDate.getTime()));
    }
    
    return format(maxDate, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (post) {
      setFormData({
        caption: post.generated_caption,
        hashtags: post.generated_hashtags.join(' '),
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '',
        social_platforms: post.social_platforms || [],
        status: post.status,
        media_url: post.media_url || ''
      });
    }
  }, [post]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageUploading(true);

    try {
      const timestamp = new Date().getTime();
      const storagePath = `images/${user.id}/${timestamp}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      setFormData(prev => ({ ...prev, media_url: publicUrlData.publicUrl }));

      toast({
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!user || !post) return;

    setGeneratingImage(true);

    try {
      const prompt = `Create a professional image for: ${post.goal}. Industry: ${post.industry}. ${post.niche_info ? `Additional context: ${post.niche_info}` : ''}`;

      const response = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (response.error) throw response.error;

      const { image } = response.data;
      setFormData(prev => ({ ...prev, media_url: image }));

      toast({
        description: "AI image generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, media_url: '' }));
  };

  const handleSave = async () => {
    if (!post || isReadOnly) return;

    try {
      setLoading(true);
      
      const updates = {
        generated_caption: formData.caption,
        generated_hashtags: formData.hashtags.split(' ').filter(tag => tag.trim()),
        scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null,
        social_platforms: formData.social_platforms,
        status: formData.status,
        media_url: formData.media_url || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      onPostUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReadOnly ? <Eye className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {isReadOnly ? 'View Post' : 'Edit Post'}
          </DialogTitle>
          <DialogDescription>
            {isReadOnly 
              ? 'Published and archived posts are read-only for analytics purposes.'
              : 'Make changes to your post content and scheduling.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Industry</Label>
              <p className="text-sm text-gray-700">{post.industry}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge className={getStatusColor(post.status)}>
                {post.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-gray-700">
                {format(new Date(post.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            {post.posted_at && (
              <div>
                <Label className="text-sm font-medium">Posted</Label>
                <p className="text-sm text-gray-700">
                  {format(new Date(post.posted_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>

          {/* Goal */}
          <div>
            <Label className="text-sm font-medium">Content Goal</Label>
            <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
              {post.goal}
            </p>
          </div>

          {/* Niche Info */}
          {post.niche_info && (
            <div>
              <Label className="text-sm font-medium">Niche Information</Label>
              <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
                {post.niche_info}
              </p>
            </div>
          )}

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              rows={6}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label htmlFor="hashtags">Hashtags</Label>
            <Textarea
              id="hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
              rows={3}
              placeholder="Enter hashtags separated by spaces"
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Image Section */}
          <div>
            <Label className="text-sm font-medium flex items-center mb-3">
              <ImageIcon className="h-4 w-4 mr-2" />
              Post Image
            </Label>
            
            {formData.media_url ? (
              <div className="space-y-3">
                <div className="relative">
                  <img 
                    src={formData.media_url} 
                    alt="Post image" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Replace Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAIImage}
                      disabled={generatingImage}
                    >
                      {generatingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4 mr-2" />
                      )}
                      Generate AI Image
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              !isReadOnly && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-3">No image attached</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAIImage}
                      disabled={generatingImage}
                    >
                      {generatingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4 mr-2" />
                      )}
                      Generate AI Image
                    </Button>
                  </div>
                </div>
              )
            )}

            {!isReadOnly && (
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            )}
          </div>

          {/* Social Media Platforms */}
          {!isReadOnly && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Social Media Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {socialPlatforms.map((platform) => {
                  const isConnected = accounts.some(acc => acc.platform === platform.id);
                  return (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={formData.social_platforms.includes(platform.id)}
                        disabled={!isConnected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              social_platforms: [...prev.social_platforms, platform.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              social_platforms: prev.social_platforms.filter(p => p !== platform.id)
                            }));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={platform.id} 
                        className={`text-sm ${!isConnected ? 'text-gray-400' : ''}`}
                      >
                        {platform.name} {!isConnected && '(Not connected)'}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Connect <Link to="/dashboard" className="text-primary hover:underline">Social Accounts</Link> in the Social Media Accounts section to enable posting.
              </p>
            </div>
          )}

          {/* Scheduling */}
          {!isReadOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Scheduled Date
                </Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  max={getMaxScheduleDate()}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="scheduled_time" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Scheduled Time
                </Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Status (only for editable posts) */}
          {!isReadOnly && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'scheduled') => {
                  // Only allow 'scheduled' if date, time and at least one social platform are set
                  if (value === 'scheduled' && (!formData.scheduled_date || !formData.scheduled_time || formData.social_platforms.length === 0)) {
                    toast({
                      title: "Scheduling Required",
                      description: "Please set scheduled date, time, and select at least one social media platform before marking as scheduled",
                      variant: "destructive",
                    });
                    return;
                  }
                  setFormData(prev => ({ ...prev, status: value }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem 
                    value="scheduled"
                    disabled={!formData.scheduled_date || !formData.scheduled_time || formData.social_platforms.length === 0}
                  >
                    Scheduled {(!formData.scheduled_date || !formData.scheduled_time || formData.social_platforms.length === 0) && '(Set date, time & platform first)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;