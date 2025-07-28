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
import { Calendar, Clock, Save, Eye, ImageIcon, Upload, X, Loader2, RotateCcw, Sparkles, Palette } from 'lucide-react';
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
  uploaded_image_url: string | null;
  ai_generated_image_1_url: string | null;
  ai_generated_image_2_url: string | null;
  selected_image_type: string | null;
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
  const [generatingWithUpload, setGeneratingWithUpload] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [originalPost, setOriginalPost] = useState<Post | null>(null);
  const [availableImages, setAvailableImages] = useState({
    uploaded: '',
    ai1: '',
    ai2: ''
  });
  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    scheduled_date: '',
    scheduled_time: '',
    social_platforms: [] as string[],
    status: 'draft' as 'draft' | 'scheduled' | 'published' | 'archived',
    media_url: '',
    uploaded_image_url: '',
    ai_generated_image_1_url: '',
    ai_generated_image_2_url: '',
    selected_image_type: ''
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
      // Store original post data for cancel functionality
      setOriginalPost(post);
      
      setFormData({
        caption: post.generated_caption,
        hashtags: post.generated_hashtags.join(' '),
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '',
        social_platforms: post.social_platforms || [],
        status: post.status,
        media_url: post.media_url || '',
        uploaded_image_url: post.uploaded_image_url || '',
        ai_generated_image_1_url: post.ai_generated_image_1_url || '',
        ai_generated_image_2_url: post.ai_generated_image_2_url || '',
        selected_image_type: post.selected_image_type || ''
      });

      // Set available images for switching
      setAvailableImages({
        uploaded: post.uploaded_image_url || '',
        ai1: post.ai_generated_image_1_url || '',
        ai2: post.ai_generated_image_2_url || ''
      });
      
      setAiImagePrompt('');
    }
  }, [post]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Authentication guard - check if user is properly authenticated
    if (!user || !user.id) {
      console.error('Upload failed: User not authenticated or missing ID', { user: user?.id });
      toast({
        title: "Authentication required",
        description: "Please ensure you are logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting image upload for user:', user.id);

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
      const storagePath = `${user.id}/${timestamp}-${file.name}`;
      
      console.log('Uploading to storage path:', storagePath);

      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      console.log('Upload successful, public URL:', publicUrlData.publicUrl);

      // Update both media_url and uploaded_image_url for this specific post
      setFormData(prev => ({ 
        ...prev, 
        media_url: publicUrlData.publicUrl,
        uploaded_image_url: publicUrlData.publicUrl,
        selected_image_type: 'uploaded'
      }));
      
      // Update available images for this specific post
      setAvailableImages(prev => ({ ...prev, uploaded: publicUrlData.publicUrl }));

      // Clear the file input to prevent issues
      event.target.value = '';

      toast({
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      console.error("Error uploading image to post:", error);
      
      // Specific error handling for RLS policy violations
      let errorMessage = "Failed to upload image";
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        errorMessage = "Upload permission denied. Please try logging out and back in.";
        console.error('RLS Policy violation detected for user:', user.id);
      } else if (error.message?.includes('storage')) {
        errorMessage = "Storage upload failed. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      // Authentication guard
      if (!user || !user.id) {
        console.error('Upload failed: User not authenticated in uploadImageToStorage');
        throw new Error('User authentication required for upload');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to storage path in uploadImageToStorage:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error in uploadImageToStorage:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      console.log('Upload successful in uploadImageToStorage:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image in uploadImageToStorage:', error);
      return null;
    }
  };

  const handleGenerateAIImage = async (includeExistingImage = false) => {
    if (!user || !post) return;

    // Check if we can generate more AI images (max 2)
    const hasAI1 = availableImages.ai1 || formData.ai_generated_image_1_url;
    const hasAI2 = availableImages.ai2 || formData.ai_generated_image_2_url;
    
    if (hasAI1 && hasAI2) {
      toast({
        title: "Maximum AI images reached",
        description: "You can generate up to 2 AI images per post",
        variant: "destructive",
      });
      return;
    }

    if (includeExistingImage) {
      setGeneratingWithUpload(true);
    } else {
      setGeneratingImage(true);
    }

    try {
      let prompt = '';
      
      // If user provided a custom prompt, use it as the primary prompt
      if (aiImagePrompt.trim()) {
        prompt = aiImagePrompt.trim();
        
        // Only add context if the custom prompt doesn't seem complete
        if (!aiImagePrompt.toLowerCase().includes(post.industry.toLowerCase())) {
          prompt += `. Context: ${post.industry} industry, Goal: ${post.goal}`;
        }
      } else {
        // Default prompt if no custom prompt provided
        prompt = `Create a professional image for: ${post.goal}. Industry: ${post.industry}. Content: ${formData.caption}. Hashtags: ${formData.hashtags}`;
        
        if (post.niche_info) {
          prompt += `. Additional context: ${post.niche_info}`;
        }
      }


      // Use the regular generate-image function for new images
      const response = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (response.error) throw response.error;

      const { image } = response.data;
      
      // Determine which AI slot to use
      const useAI1 = !hasAI1; // Use AI1 first, then AI2
      const aiSlot = useAI1 ? 'ai1' : 'ai2';
      const aiField = useAI1 ? 'ai_generated_image_1_url' : 'ai_generated_image_2_url';
      
      // Convert base64 to blob and upload to storage for persistence
      const blob = await fetch(image).then(r => r.blob());
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });
      const persistentUrl = await uploadImageToStorage(file);
      
      if (!persistentUrl) {
        throw new Error("Failed to upload AI image to storage");
      }

      // Update form data with persistent URL and specific type
      const specificType = useAI1 ? 'ai_generated_1' : 'ai_generated_2';
      
      // Create the updated form data
      const updatedFormData = { 
        ...formData, 
        media_url: persistentUrl,
        [aiField]: persistentUrl,
        selected_image_type: specificType
      };
      
      setFormData(updatedFormData);
      
      // Update available images with persistent URL
      setAvailableImages(prev => ({ ...prev, [aiSlot]: persistentUrl }));

      // Immediately save to database
      const updates = {
        generated_caption: updatedFormData.caption,
        generated_hashtags: updatedFormData.hashtags.split(' ').filter(tag => tag.trim()),
        scheduled_date: updatedFormData.scheduled_date || null,
        scheduled_time: updatedFormData.scheduled_time || null,
        status: updatedFormData.status,
        media_url: persistentUrl,
        uploaded_image_url: updatedFormData.uploaded_image_url || null,
        ai_generated_image_1_url: useAI1 ? persistentUrl : (updatedFormData.ai_generated_image_1_url || null),
        ai_generated_image_2_url: useAI1 ? (updatedFormData.ai_generated_image_2_url || null) : persistentUrl,
        selected_image_type: specificType,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', post.id);

      if (updateError) {
        console.error('Error updating post with AI image:', updateError);
        // Still show success for image generation but mention save issue
        toast({
          title: "AI image generated",
          description: "Image created but auto-save failed. Please save manually.",
          variant: "destructive",
        });
      } else {
        toast({
          description: "AI image generated and saved successfully!",
        });
        onPostUpdated(); // Refresh the parent component
      }

      // Clear the AI image prompt after successful generation
      setAiImagePrompt('');
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      if (includeExistingImage) {
        setGeneratingWithUpload(false);
      } else {
        setGeneratingImage(false);
      }
    }
  };

  const handleSelectImage = (imageType: 'uploaded' | 'ai1' | 'ai2') => {
    const imageUrl = availableImages[imageType];
    
    // Map to specific database values for better analytics
    let validImageType = 'none';
    if (imageType === 'uploaded' && imageUrl) {
      validImageType = 'uploaded';
    } else if (imageType === 'ai1' && imageUrl) {
      validImageType = 'ai_generated_1';
    } else if (imageType === 'ai2' && imageUrl) {
      validImageType = 'ai_generated_2';
    }

    console.log('Selecting image:', { imageType, imageUrl, validImageType });

    if (imageUrl) {
      setFormData(prev => ({ 
        ...prev, 
        media_url: imageUrl,
        selected_image_type: validImageType,
        // Also update the specific field to maintain consistency
        ...(imageType === 'uploaded' && { uploaded_image_url: imageUrl }),
        ...(imageType === 'ai1' && { ai_generated_image_1_url: imageUrl }),
        ...(imageType === 'ai2' && { ai_generated_image_2_url: imageUrl })
      }));
    }
  };

  // Helper function to determine current selection from URLs and database value
  const getCurrentImageType = (): 'uploaded' | 'ai1' | 'ai2' | 'none' => {
    if (!formData.media_url) return 'none';
    
    // First try to match by stored type for accuracy
    if (formData.selected_image_type === 'uploaded') return 'uploaded';
    if (formData.selected_image_type === 'ai_generated_1') return 'ai1';
    if (formData.selected_image_type === 'ai_generated_2') return 'ai2';
    
    // Fallback to URL matching for backward compatibility
    if (formData.media_url === availableImages.uploaded) return 'uploaded';
    if (formData.media_url === availableImages.ai1) return 'ai1';
    if (formData.media_url === availableImages.ai2) return 'ai2';
    
    return 'none';
  };

  const handleRemoveImage = () => {
    // Only allow removing uploaded images, not AI-generated ones
    const currentType = getCurrentImageType();
    if (currentType === 'uploaded') {
      setFormData(prev => ({ ...prev, media_url: '', selected_image_type: 'none' }));
    }
  };

  const handleCancel = () => {
    if (originalPost) {
      // Revert to original state
      setFormData({
        caption: originalPost.generated_caption,
        hashtags: originalPost.generated_hashtags.join(' '),
        scheduled_date: originalPost.scheduled_date || '',
        scheduled_time: originalPost.scheduled_time || '',
        social_platforms: originalPost.social_platforms || [],
        status: originalPost.status,
        media_url: originalPost.media_url || '',
        uploaded_image_url: originalPost.uploaded_image_url || '',
        ai_generated_image_1_url: originalPost.ai_generated_image_1_url || '',
        ai_generated_image_2_url: originalPost.ai_generated_image_2_url || '',
        selected_image_type: originalPost.selected_image_type || ''
      });
      
      setAvailableImages({
        uploaded: originalPost.uploaded_image_url || '',
        ai1: originalPost.ai_generated_image_1_url || '',
        ai2: originalPost.ai_generated_image_2_url || ''
      });
    }
    onOpenChange(false);
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
        status: formData.status,
        media_url: formData.media_url || null,
        uploaded_image_url: formData.uploaded_image_url || null,
        ai_generated_image_1_url: formData.ai_generated_image_1_url || null,
        ai_generated_image_2_url: formData.ai_generated_image_2_url || null,
        selected_image_type: formData.selected_image_type || null,
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
                    className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowImageLightbox(true)}
                  />
                   {!isReadOnly && getCurrentImageType() === 'uploaded' && (
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
                  <div className="space-y-3">
                 {/* Image selection buttons */}
                     {(availableImages.uploaded || availableImages.ai1 || availableImages.ai2) && (
                        <div className="flex flex-wrap gap-2">
                          {availableImages.uploaded && (
                            <Button
                              variant={getCurrentImageType() === 'uploaded' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSelectImage('uploaded')}
                            >
                              Use Uploaded
                            </Button>
                          )}
                          {availableImages.ai1 && (
                            <Button
                              variant={getCurrentImageType() === 'ai1' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSelectImage('ai1')}
                            >
                              Use AI Image 1
                            </Button>
                          )}
                          {availableImages.ai2 && (
                            <Button
                              variant={getCurrentImageType() === 'ai2' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSelectImage('ai2')}
                            >
                              Use AI Image 2
                            </Button>
                          )}
                        </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('edit-dialog-file-input')?.click()}
                        disabled={imageUploading}
                      >
                        {imageUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {availableImages.uploaded ? 'Replace Upload' : 'Upload Image'}
                      </Button>
                      
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleGenerateAIImage(false)}
                         disabled={generatingImage || generatingWithUpload || Boolean(availableImages.ai1 && availableImages.ai2)}
                         className="flex-1"
                       >
                       {generatingImage ? (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       ) : (
                         <Sparkles className="h-4 w-4 mr-2" />
                       )}
                       {availableImages.ai1 && availableImages.ai2 
                         ? 'Max AI Images' 
                         : availableImages.ai1 
                           ? 'Generate new AI Image' 
                           : 'Generate AI Image'}
                       </Button>
                     </div>
                  </div>
                )}
              </div>
            ) : (availableImages.uploaded || availableImages.ai1 || availableImages.ai2) && !isReadOnly ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">No image selected</p>
                <div className="space-y-3">
                  {/* Image selection buttons */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableImages.uploaded && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectImage('uploaded')}
                      >
                        Use Uploaded
                      </Button>
                    )}
                    {availableImages.ai1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectImage('ai1')}
                      >
                        Use AI Image 1
                      </Button>
                    )}
                    {availableImages.ai2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectImage('ai2')}
                      >
                        Use AI Image 2
                      </Button>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('edit-dialog-file-input')?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {availableImages.uploaded ? 'Replace Upload' : 'Upload New'}
                    </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleGenerateAIImage(false)}
                       disabled={generatingImage || generatingWithUpload || Boolean(availableImages.ai1 && availableImages.ai2)}
                     >
                       {generatingImage ? (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       ) : (
                         <Sparkles className="h-4 w-4 mr-2" />
                       )}
                       {availableImages.ai1 && availableImages.ai2 
                         ? 'Max AI Images' 
                         : availableImages.ai1 
                           ? 'Generate new AI Image' 
                           : 'Generate AI'}
                     </Button>
                  </div>
                </div>
              </div>
            ) : !isReadOnly ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">No image attached</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('edit-dialog-file-input')?.click()}
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
                    onClick={() => handleGenerateAIImage(false)}
                    disabled={generatingImage || generatingWithUpload || Boolean(availableImages.ai1 && availableImages.ai2)}
                  >
                    {generatingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {availableImages.ai1 
                      ? 'Generate new AI Image' 
                      : 'Generate AI Image'}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* AI Image Prompt Text Area */}
            {!isReadOnly && !(availableImages.ai1 && availableImages.ai2) && (
              <div className="mt-4">
                <Label htmlFor="ai-prompt" className="text-sm font-medium mb-2 block">
                  AI Image Requirements (Optional)
                </Label>
                <Textarea
                  id="ai-prompt"
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="Describe specific requirements for the AI image (e.g., 'include company logo', 'modern minimalist style', 'bright colors')"
                  rows={2}
                  className="text-sm"
                />
                 <p className="text-xs text-muted-foreground mt-1">
                   💡 Pro tip: Describe any specific visual elements (colors, style, branding) in your requirements for better AI image results.
                 </p>
              </div>
            )}

            {!isReadOnly && (
              <input
                id="edit-dialog-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            )}
          </div>

          {/* Image Lightbox */}
          {showImageLightbox && formData.media_url && (
            <Dialog open={showImageLightbox} onOpenChange={setShowImageLightbox}>
              <DialogContent className="max-w-4xl p-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>View Image</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <img 
                    src={formData.media_url} 
                    alt="Full size post image" 
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

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
                <SelectTrigger id="status">
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
            <Button variant="outline" onClick={handleCancel}>
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