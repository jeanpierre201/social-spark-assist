import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { useOptionalSocialAccounts } from '@/hooks/useSocialAccounts';
import { useManualPublish } from '@/hooks/useManualPublish';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Save, Eye, ImageIcon, Upload, X, Loader2, RotateCcw, Sparkles, Send, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

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
  user_timezone: string | null;
  social_platforms: string[];
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed' | 'partially_published';
  created_at: string;
  posted_at: string | null;
  error_message?: string | null;
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
  const { subscriptionEnd, subscriptionTier } = useSubscription();
  
  // Use optional hook - returns null if provider missing
  const socialContext = useOptionalSocialAccounts();
  const accounts = socialContext?.accounts ?? [];
  const accountsLoading = socialContext?.loading ?? false;
  
  const { publishToMastodon, publishToFacebook, publishToTwitter, publishToTelegram, isPublishingPost } = useManualPublish();
  // Get subscription status based on tier
  const starterStatus = useStarterSubscriptionStatus();
  const proStatus = useProSubscriptionStatus();
  
  // Only consider subscription expired when we have loaded the status
  // During loading, assume not expired to avoid blocking edit dialog
  const isSubscriptionExpired = subscriptionTier === 'Starter' 
    ? (starterStatus.isLoading ? false : !starterStatus.canCreatePosts)
    : subscriptionTier === 'Pro' 
      ? (proStatus.isLoading ? false : !proStatus.canCreatePosts)
      : false;
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingWithUpload, setGeneratingWithUpload] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [originalPost, setOriginalPost] = useState<Post | null>(null);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [availableImages, setAvailableImages] = useState({
    uploaded: '',
    ai1: '',
    ai2: ''
  });
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [timezoneDisplay, setTimezoneDisplay] = useState<string>('');
  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    scheduled_date: '',
    scheduled_time: '',
    social_platforms: [] as string[],
    status: 'draft' as 'draft' | 'ready' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed' | 'partially_published',
    media_url: '',
    uploaded_image_url: '',
    ai_generated_image_1_url: '',
    ai_generated_image_2_url: '',
    selected_image_type: ''
  });

  // Fetch user timezone from profile
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();
      
      if (!error && data?.timezone) {
        setUserTimezone(data.timezone);
      } else {
        // Fallback to browser timezone
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(browserTz);
      }
    };
    
    fetchUserTimezone();
  }, [user?.id]);

  // Calculate and display timezone offset
  useEffect(() => {
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const gmtOffset = `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setTimezoneDisplay(`${userTimezone} (${gmtOffset})`);
  }, [userTimezone]);

  const socialPlatforms = [
    { id: 'mastodon', name: 'Mastodon', tier: 'Free' },
    { id: 'telegram', name: 'Telegram', tier: 'Free' },
    { id: 'facebook', name: 'Facebook', tier: 'Starter' },
    { id: 'instagram', name: 'Instagram', tier: 'Starter' },
    { id: 'tiktok', name: 'TikTok', tier: 'Starter', beta: true },
    { id: 'linkedin', name: 'LinkedIn', tier: 'Pro' },
    { id: 'x', name: 'X (Twitter)', tier: 'Pro', comingSoon: true }
  ];

  const isEditable = (post?.status === 'draft' || post?.status === 'ready' || post?.status === 'scheduled' || post?.status === 'rescheduled' || post?.status === 'failed') && !isSubscriptionExpired;
  const isReadOnly = !isEditable;

  // Calculate the maximum allowed scheduling date based on subscription period
  const getMaxScheduleDate = () => {
    if (!post) return format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    const today = new Date();
    
    // If subscription has an end date, use that as the limit
    if (subscriptionEnd) {
      const subscriptionEndDate = new Date(subscriptionEnd);
      const maxDate = new Date(Math.min(subscriptionEndDate.getTime(), today.getTime() + 30 * 24 * 60 * 60 * 1000));
      return format(maxDate, 'yyyy-MM-dd');
    }
    
    // Default to 30 days from today if no subscription end
    return format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (post && open) {
      // Store original post data for cancel functionality
      setOriginalPost(post);
      
      // Convert UTC scheduled times to local time for display
      let localDate = post.scheduled_date || '';
      let localTime = post.scheduled_time || '';
      
      if (post.scheduled_date && post.scheduled_time) {
        try {
          // Use stored timezone or fallback to browser timezone
          const timezone = post.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
          const utcDateTimeStr = `${post.scheduled_date}T${post.scheduled_time}:00Z`;
          const localDateTime = toZonedTime(utcDateTimeStr, timezone);
          localDate = format(localDateTime, 'yyyy-MM-dd');
          localTime = format(localDateTime, 'HH:mm');
        } catch (error) {
          console.error('Error converting UTC to local time:', error);
        }
      }
      
      // Normalize platform IDs: 'twitter' -> 'x' for UI consistency
      // Ensure social_platforms is always an array
      const platformsArray = Array.isArray(post.social_platforms) 
        ? post.social_platforms 
        : [];
      const normalizedPlatforms = platformsArray.map(p => 
        p === 'twitter' ? 'x' : p
      );
      
      // Safely handle hashtags array - add # prefix for display
      const hashtagsArray = Array.isArray(post.generated_hashtags) 
        ? post.generated_hashtags 
        : [];
      const hashtagsWithPrefix = hashtagsArray.map(tag => 
        tag.startsWith('#') ? tag : `#${tag}`
      );
      
      const initialFormData = {
        caption: post.generated_caption || '',
        hashtags: hashtagsWithPrefix.join(' '),
        scheduled_date: localDate,
        scheduled_time: localTime,
        social_platforms: normalizedPlatforms,
        status: post.status,
        media_url: post.media_url || '',
        uploaded_image_url: post.uploaded_image_url || '',
        ai_generated_image_1_url: post.ai_generated_image_1_url || '',
        ai_generated_image_2_url: post.ai_generated_image_2_url || '',
        selected_image_type: post.selected_image_type || ''
      };
      
      setFormData(initialFormData);
      // Store original form data for dirty checking
      setOriginalFormData(initialFormData);

      // Set available images for switching
      setAvailableImages({
        uploaded: post.uploaded_image_url || '',
        ai1: post.ai_generated_image_1_url || '',
        ai2: post.ai_generated_image_2_url || ''
      });
      
      setAiImagePrompt('');
    }
  }, [post, open]);

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
      } else {
        // Use caption as the primary prompt for image generation
        prompt = `Create a professional social media image that represents: ${formData.caption}`;
        if (formData.hashtags.trim()) {
          prompt += `. Related topics: ${formData.hashtags.replace(/#/g, '')}`;
        }
        if (post.industry) {
          prompt += `. Industry context: ${post.industry}`;
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

    // Validate hashtags have # prefix
    const hashtagParts = formData.hashtags.trim().split(/\s+/).filter(tag => tag.length > 0);
    const invalidHashtags = hashtagParts.filter(tag => !tag.startsWith('#'));
    if (hashtagParts.length > 0 && invalidHashtags.length > 0) {
      toast({
        title: "Invalid Hashtags",
        description: "Each hashtag must start with #. Please fix: " + invalidHashtags.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Convert local time to UTC for storage
      let utcDateStr: string | null = formData.scheduled_date;
      let utcTimeStr: string | null = formData.scheduled_time;
      
      if (formData.scheduled_date && formData.scheduled_time) {
        const localDateTimeStr = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
        const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
        // Use toISOString() to correctly extract UTC components
        utcDateStr = utcDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        utcTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC
      }
      
      // Determine status based on social media and scheduling
      const hasPlatforms = formData.social_platforms && formData.social_platforms.length > 0;
      const hasSchedule = formData.scheduled_date && formData.scheduled_time;
      
      // Clear schedule if no platforms selected
      let finalScheduledDate = utcDateStr;
      let finalScheduledTime = utcTimeStr;
      if (!hasPlatforms) {
        finalScheduledDate = null;
        finalScheduledTime = null;
      }
      
      // Auto-calculate status based on platforms and schedule
      // Only keep 'published' as-is; all editable statuses get recalculated
      let status: typeof formData.status;
      if (post.status === 'published') {
        status = 'published';
      } else if (hasPlatforms) {
        status = hasSchedule ? 'scheduled' : 'ready';
      } else {
        status = 'draft';
      }
      
      // Parse hashtags - remove # prefix for database storage
      const parsedHashtags = formData.hashtags.split(/\s+/)
        .filter(tag => tag.startsWith('#') && tag.length > 1)
        .map(tag => tag.substring(1)); // Remove # for storage
      
      const updates = {
        generated_caption: formData.caption,
        generated_hashtags: parsedHashtags,
        scheduled_date: finalScheduledDate || null,
        scheduled_time: finalScheduledTime || null,
        user_timezone: userTimezone,
        social_platforms: formData.social_platforms,
        status: status,
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
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if scheduling should be disabled (no platforms selected)
  const schedulingDisabled = !formData.social_platforms || formData.social_platforms.length === 0;

  // Auto-calculate status based on platforms and schedule (for display)
  const calculatedStatus = (() => {
    const hasPlatforms = formData.social_platforms && formData.social_platforms.length > 0;
    const hasSchedule = formData.scheduled_date && formData.scheduled_time;
    
    if (hasPlatforms) {
      return hasSchedule ? 'scheduled' : 'ready';
    }
    return 'draft';
  })();

  // Safety check - early return for null post
  if (!post) return null;

  // Defensive check for malformed post data - allow null/undefined generated_caption (will be normalized)
  if (!post.id) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Post
            </DialogTitle>
            <DialogDescription>
              This post's data appears to be incomplete or corrupted. Please try refreshing the page.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if form has been modified (dirty state)
  const hasChanges = (): boolean => {
    if (!originalFormData) return false;
    return (
      formData.caption !== originalFormData.caption ||
      formData.hashtags !== originalFormData.hashtags ||
      formData.scheduled_date !== originalFormData.scheduled_date ||
      formData.scheduled_time !== originalFormData.scheduled_time ||
      formData.media_url !== originalFormData.media_url ||
      formData.selected_image_type !== originalFormData.selected_image_type ||
      JSON.stringify(formData.social_platforms.sort()) !== JSON.stringify(originalFormData.social_platforms.sort())
    );
  };
  
  const isDirty = hasChanges();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReadOnly ? <Eye className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {isReadOnly ? 'View Post' : 'Edit Post'}
          </DialogTitle>
          <DialogDescription>
            {isSubscriptionExpired
              ? 'Your 30-day creation period has expired. This post can no longer be edited or scheduled.'
              : isReadOnly 
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
                {post.status === 'partially_published' ? 'Partial' : post.status === 'rescheduled' ? 'Retrying' : post.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-gray-700">
                {(() => {
                  const created = post.created_at ? new Date(post.created_at) : null;
                  if (!created || isNaN(created.getTime())) return 'N/A';
                  return format(created, 'MMM dd, yyyy HH:mm');
                })()}
              </p>
            </div>
            {post.posted_at && (
              <div>
                <Label className="text-sm font-medium">Posted</Label>
                <p className="text-sm text-gray-700">
                  {(() => {
                    const postedDate = post.posted_at ? new Date(post.posted_at) : null;
                    if (!postedDate || isNaN(postedDate.getTime())) return 'N/A';
                    const localPostedDate = toZonedTime(postedDate, userTimezone);
                    return format(localPostedDate, 'MMM dd, yyyy HH:mm');
                  })()}
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
              placeholder="Enter hashtags with # prefix, separated by spaces (e.g., #marketing #business)"
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50' : ''}
            />
            {!isReadOnly && (
              <p className="text-xs text-muted-foreground mt-1">
                Each hashtag must start with #
              </p>
            )}
          </div>

          {/* Image Section */}
          <div>
            <Label className="text-sm font-medium flex items-center mb-3">
              <ImageIcon className="h-4 w-4 mr-2" />
              Post Image
            </Label>
            
            {/* Display current image if any */}
            {formData.media_url && (
              <div className="mb-3">
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
              </div>
            )}

            {/* No image placeholder */}
            {!formData.media_url && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-3">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">No image attached</p>
              </div>
            )}

            {/* Image buttons - always show when editable */}
            {!isReadOnly && (
              <div className="space-y-3">
                {/* Three-button row based on state */}
                <div className="flex gap-2 flex-wrap">
                  {/* Button 1: Upload Image */}
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
                  
                  {/* Button 2: Generate AI Image OR Use AI Image 1 */}
                  {!availableImages.ai1 ? (
                    // No AI images yet - show "Generate AI Image"
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateAIImage(false)}
                      disabled={generatingImage || generatingWithUpload}
                    >
                      {generatingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate AI Image
                    </Button>
                  ) : (
                    // Has AI Image 1 - show "Use AI Image 1" button
                    <Button
                      variant={getCurrentImageType() === 'ai1' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectImage('ai1')}
                    >
                      Use AI Image 1
                    </Button>
                  )}
                  
                  {/* Button 3: Disabled "Generate new AI Image" OR "Use AI Image 2" */}
                  {!availableImages.ai1 ? (
                    // No AI images - show disabled "Generate new AI Image"
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate new AI Image
                    </Button>
                  ) : !availableImages.ai2 ? (
                    // Has AI1 but no AI2 - show enabled "Generate new AI Image"
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateAIImage(false)}
                      disabled={generatingImage || generatingWithUpload}
                    >
                      {generatingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate new AI Image
                    </Button>
                  ) : (
                    // Has both AI1 and AI2 - show "Use AI Image 2" button
                    <Button
                      variant={getCurrentImageType() === 'ai2' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectImage('ai2')}
                    >
                      Use AI Image 2
                    </Button>
                  )}
                </div>

                {/* AI Image Prompt Text Area - only show if can generate more AI images */}
                {!(availableImages.ai1 && availableImages.ai2) && (
                  <div className="mt-2">
                    <Label htmlFor="ai-prompt" className="text-sm font-medium mb-2 block">
                      Image Description (Optional)
                    </Label>
                    <Textarea
                      id="ai-prompt"
                      value={aiImagePrompt}
                      onChange={(e) => setAiImagePrompt(e.target.value)}
                      placeholder="Describe how you want your image to look... e.g., 'Modern office setting with laptop, professional lighting, blue color scheme'"
                      rows={2}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 DALL-E 3 creates images from text descriptions only. Describe visual elements like colors, style, objects, and composition for best results.
                    </p>
                  </div>
                )}
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
              {(() => {
                // Helper to check connection (handles twitter/x equivalence)
                const isPlatformConnected = (platformId: string) => {
                  if (platformId === 'x' || platformId === 'twitter') {
                    return accounts.some(acc => (acc.platform === 'x' || acc.platform === 'twitter') && acc.is_active);
                  }
                  return accounts.some(acc => acc.platform === platformId && acc.is_active);
                };
                
                // Find disconnected platforms that are currently selected
                const disconnectedSelectedPlatforms = formData.social_platforms.filter(
                  pId => !isPlatformConnected(pId)
                );
                const hasDisconnectedPlatforms = disconnectedSelectedPlatforms.length > 0;
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <TooltipProvider>
                        {socialPlatforms.map((platform) => {
                          const isConnected = isPlatformConnected(platform.id);
                          const isComingSoon = platform.comingSoon;
                          const isBeta = platform.beta;
                          const isChecked = formData.social_platforms.includes(platform.id);
                          // Allow unchecking even if disconnected, but prevent checking new disconnected platforms
                          const isDisabled = isComingSoon || (!isConnected && !isChecked);
                          
                          return (
                            <div key={platform.id} className="flex items-center space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={platform.id}
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormData(prev => ({
                                            ...prev,
                                            social_platforms: [...prev.social_platforms, platform.id]
                                          }));
                                        } else {
                                          const newPlatforms = formData.social_platforms.filter(p => p !== platform.id);
                                          setFormData(prev => ({
                                            ...prev,
                                            social_platforms: newPlatforms,
                                            // Clear schedule if no platforms remain
                                            ...(newPlatforms.length === 0 && { scheduled_date: '', scheduled_time: '' })
                                          }));
                                        }
                                      }}
                                    />
                                    <Label 
                                      htmlFor={platform.id} 
                                      className={`text-sm flex items-center gap-1.5 ${isDisabled ? 'text-muted-foreground' : ''} ${isChecked && !isConnected ? 'text-destructive' : ''}`}
                                    >
                                      {platform.name}
                                      {isChecked && !isConnected && (
                                        <AlertTriangle className="h-3 w-3 text-destructive" />
                                      )}
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        {platform.tier}
                                      </Badge>
                                      {isBeta && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800">
                                          β
                                        </Badge>
                                      )}
                                      {isComingSoon && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                          Soon
                                        </Badge>
                                      )}
                                    </Label>
                                  </div>
                                </TooltipTrigger>
                                {(isDisabled || (isChecked && !isConnected)) && (
                                  <TooltipContent>
                                    {isComingSoon ? 'Coming soon' : isChecked && !isConnected ? 'Account disconnected - uncheck or reconnect' : 'Connect this account in Social Settings'}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          );
                        })}
                      </TooltipProvider>
                    </div>
                    
                    {/* Disconnected platforms warning */}
                    {hasDisconnectedPlatforms && (
                      <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-destructive font-medium">
                              Disconnected accounts: {disconnectedSelectedPlatforms.map(p => 
                                socialPlatforms.find(sp => sp.id === p)?.name || p
                              ).join(', ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Uncheck these platforms or reconnect to publish.
                            </p>
                            <Link 
                              to="/dashboard/social" 
                              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                            >
                              Reconnect Account →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Connect <Link to="/dashboard/social" className="text-primary hover:underline">Social Accounts</Link> to enable posting.
                    </p>
                  </>
                );
              })()}
              
              {/* Post Now Button */}
              {formData.social_platforms.length > 0 && post?.status !== 'published' && !isSubscriptionExpired && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      if (!post) return;
                      
                      const selectedPlatforms = formData.social_platforms;
                      const message = formData.caption + (formData.hashtags ? '\n\n' + formData.hashtags : '');
                      const imageUrl = formData.media_url || undefined;
                      
                      let publishedCount = 0;
                      let failedCount = 0;
                      const missingAccounts: string[] = [];
                      
                      for (const platformId of selectedPlatforms) {
                        if (platformId === 'mastodon') {
                          const mastodonAccount = accounts.find(acc => acc.platform === 'mastodon' && acc.is_active);
                          if (mastodonAccount) {
                            const result = await publishToMastodon(post.id, message, imageUrl);
                            if (result.success) publishedCount++; else failedCount++;
                          } else {
                            missingAccounts.push('Mastodon');
                          }
                        } else if (platformId === 'telegram') {
                          const telegramAccount = accounts.find(acc => acc.platform === 'telegram' && acc.is_active);
                          if (telegramAccount) {
                            const result = await publishToTelegram(post.id, message, imageUrl);
                            if (result.success) publishedCount++; else failedCount++;
                          } else {
                            missingAccounts.push('Telegram');
                          }
                        } else if (platformId === 'facebook') {
                          const fbAccount = accounts.find(acc => acc.platform === 'facebook' && acc.is_active);
                          if (fbAccount) {
                            const result = await publishToFacebook(post.id, fbAccount.id, message, imageUrl);
                            if (result.success) publishedCount++; else failedCount++;
                          } else {
                            missingAccounts.push('Facebook');
                          }
                        } else if (platformId === 'twitter' || platformId === 'x') {
                          const twitterAccount = accounts.find(acc => (acc.platform === 'twitter' || acc.platform === 'x') && acc.is_active);
                          if (twitterAccount) {
                            const result = await publishToTwitter(post.id, twitterAccount.id, message);
                            if (result.success) publishedCount++; else failedCount++;
                          } else {
                            missingAccounts.push('X (Twitter)');
                          }
                        }
                      }
                      
                      // Show feedback
                      if (missingAccounts.length > 0) {
                        toast({
                          title: 'Account not connected',
                          description: `Please connect ${missingAccounts.join(', ')} in Social Media Settings`,
                          variant: 'destructive',
                        });
                      }
                      
                      onPostUpdated();
                      
                      // Close dialog if at least one platform succeeded
                      if (publishedCount > 0) {
                        onOpenChange(false);
                      }
                    }}
                    disabled={isPublishingPost(post?.id || '') || accountsLoading}
                    className="w-full"
                    variant="default"
                  >
                    {isPublishingPost(post?.id || '') ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Now to {formData.social_platforms.length} platform{formData.social_platforms.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Scheduling */}
          {!isReadOnly && (
            <>
              {schedulingDisabled && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Select at least one social media platform to enable scheduling
                  </p>
                </div>
              )}
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
                    disabled={isSubscriptionExpired || schedulingDisabled}
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
                    disabled={isSubscriptionExpired || schedulingDisabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>
              </div>
              {/* Show UTC time when schedule is set */}
              {formData.scheduled_date && formData.scheduled_time && (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const localDateTimeStr = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
                    const utcDate = fromZonedTime(localDateTimeStr, userTimezone);
                    const utcDateStr = utcDate.toISOString().split('T')[0];
                    const utcTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5);
                    return `Publishing at UTC: ${utcDateStr} ${utcTimeStr}`;
                  })()}
                </p>
              )}
              {/* Reset Schedule button when schedule is set */}
              {formData.scheduled_date && formData.scheduled_time && !schedulingDisabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, scheduled_date: '', scheduled_time: '' }))}
                  className="w-fit"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Schedule
                </Button>
              )}
              <p className="text-xs text-muted-foreground col-span-2">
                Your timezone: {timezoneDisplay}. Choose the date and time in your local time; we'll automatically convert it to UTC for publishing.
              </p>
            </>
          )}

          {/* Status (auto-calculated, read-only display) */}
          {!isReadOnly && (
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge className={`${getStatusColor(calculatedStatus)} text-sm px-3 py-1`}>
                  {calculatedStatus.charAt(0).toUpperCase() + calculatedStatus.slice(1)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Status is automatically set based on your selections:
                  {!formData.social_platforms?.length && ' No platforms selected → Draft'}
                  {formData.social_platforms?.length > 0 && !formData.scheduled_date && ' Platforms selected, no schedule → Ready'}
                  {formData.social_platforms?.length > 0 && formData.scheduled_date && formData.scheduled_time && ' Platforms + schedule → Scheduled'}
                </p>
              </div>
            </div>
          )}
        </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={loading || !isDirty}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;