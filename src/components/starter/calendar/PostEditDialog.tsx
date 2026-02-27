import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Upload, ImageIcon, Wand2, Edit, Trash2, RotateCcw, CheckCircle, Layers, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePostsManager } from '@/hooks/usePostsManager';
import { useBrand } from '@/hooks/useBrand';
import { useState, useEffect, useMemo } from 'react';
import { getLowestLimit, getLimitingPlatform, hasDifferentLimits, getCharacterCountColor, PLATFORM_CHARACTER_LIMITS } from '@/config/characterLimits';
import { applyLogoOverlay, LogoPlacement } from '@/utils/logoOverlay';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  // Current selected image
  image?: string;
  // Image storage
  uploadedImage?: string;
  aiImage1?: string;
  aiImage2?: string;
  // Image management
  selectedImageType?: 'none' | 'uploaded' | 'ai_1' | 'ai_2';
  aiGenerationsCount?: number;
  aiImagePrompts?: string[];
}

interface PostData {
  id?: string;
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
  created_at?: string;
  social_platforms?: string[];
}

interface PostEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost: PostData | null;
  onPostChange: (post: PostData) => void;
  onSave: () => Promise<void>;
}

const PostEditDialog = ({ isOpen, onClose, editingPost, onPostChange, onSave }: PostEditDialogProps) => {
  const { toast } = useToast();
  const { updatePostMutation } = usePostsManager();
  const { brand } = useBrand();
  const [showFullImage, setShowFullImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedImageBackup, setSelectedImageBackup] = useState<{
    uploadedImage?: string;
    aiImage1?: string;
    aiImage2?: string;
  } | null>(null);
  const [originalImageState, setOriginalImageState] = useState<{
    uploadedImage?: string;
    aiImage1?: string;
    aiImage2?: string;
    selectedImageType?: 'none' | 'uploaded' | 'ai_1' | 'ai_2';
    aiGenerationsCount?: number;
  } | null>(null);

  // Initialize image management state from existing post data
  useEffect(() => {
    if (editingPost?.generatedContent && isOpen) {
      const content = editingPost.generatedContent;
      
      console.log('Dialog opened - storing original image state:', {
        uploadedImage: content.uploadedImage,
        aiImage1: content.aiImage1,
        aiImage2: content.aiImage2,
        selectedImageType: content.selectedImageType,
        aiGenerationsCount: content.aiGenerationsCount
      });
      
      // Store original state when dialog opens
      setOriginalImageState({
        uploadedImage: content.uploadedImage,
        aiImage1: content.aiImage1,
        aiImage2: content.aiImage2,
        selectedImageType: content.selectedImageType,
        aiGenerationsCount: content.aiGenerationsCount
      });
      
      // Initialize the new structure from existing data if needed
      if (!content.selectedImageType && content.image) {
        onPostChange({
          ...editingPost,
          generatedContent: {
            ...content,
            uploadedImage: content.image,
            selectedImageType: 'uploaded',
            aiGenerationsCount: 0,
            aiImagePrompts: []
          }
        });
      }
    }
  }, [editingPost?.id, isOpen]);

  const handleSave = async () => {
    if (!editingPost?.id) return;
    
    try {
      const content = editingPost.generatedContent;
      
      // Determine the media_url based on selected image type
      let mediaUrl = null;
      switch (content?.selectedImageType) {
        case 'uploaded':
          mediaUrl = content.uploadedImage;
          break;
        case 'ai_1':
          mediaUrl = content.aiImage1;
          break;
        case 'ai_2':
          mediaUrl = content.aiImage2;
          break;
        default:
          mediaUrl = null;
      }

      await updatePostMutation.mutateAsync({
        id: editingPost.id,
        industry: editingPost.industry,
        goal: editingPost.goal,
        niche_info: editingPost.nicheInfo,
        content: content?.caption || '',
        hashtags: content?.hashtags || [],
        scheduled_date: editingPost.scheduledDate,
        scheduled_time: editingPost.scheduledTime,
        uploaded_image_url: content?.uploadedImage,
        ai_generated_image_1_url: content?.aiImage1,
        ai_generated_image_2_url: content?.aiImage2,
        selected_image_type: content?.selectedImageType || 'none',
        ai_generations_count: content?.aiGenerationsCount || 0,
        ai_image_prompts: content?.aiImagePrompts || [],
        status: editingPost.scheduledDate && editingPost.scheduledTime ? 'scheduled' : 'draft',
        social_platforms: editingPost.social_platforms || []
      });
      
      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post changes",
        variant: "destructive",
      });
    }
  };

  const updateImageSelection = (imageType: 'none' | 'uploaded' | 'ai_1' | 'ai_2') => {
    const content = editingPost?.generatedContent;
    let selectedImageUrl = '';
    
    switch (imageType) {
      case 'uploaded':
        selectedImageUrl = content?.uploadedImage || '';
        break;
      case 'ai_1':
        selectedImageUrl = content?.aiImage1 || '';
        break;
      case 'ai_2':
        selectedImageUrl = content?.aiImage2 || '';
        break;
      default:
        selectedImageUrl = '';
    }

    onPostChange({
      ...editingPost!,
      generatedContent: {
        ...content!,
        selectedImageType: imageType,
        image: selectedImageUrl
      }
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingPost?.id) return;

    console.log('Starting image upload...', { file: file.name, postId: editingPost.id });

    try {
      // Include user ID in the file path for proper access control
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', userId);
      
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Storage upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Update the local state first
      const content = editingPost?.generatedContent;
      const newContent = {
        ...content!,
        uploadedImage: publicUrl,
        selectedImageType: 'uploaded' as const,
        image: publicUrl
      };

      console.log('Updating local state with:', newContent);

      onPostChange({
        ...editingPost!,
        generatedContent: newContent
      });

      // Then update the database
      console.log('Updating database...');
      await updatePostMutation.mutateAsync({
        id: editingPost.id,
        content: newContent.caption || '',
        hashtags: newContent.hashtags || [],
        uploaded_image_url: publicUrl,
        selected_image_type: 'uploaded'
      });

      console.log('Database update successful');

      // Reset the input value to allow uploading the same file again
      event.target.value = '';

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      });
      // Reset the input value even on error
      event.target.value = '';
    }
  };

  const generateAIImage = async (includeExistingImage: boolean = false) => {
    const content = editingPost?.generatedContent;
    const generationsCount = content?.aiGenerationsCount || 0;
    
    if (generationsCount >= 2) {
      toast({
        title: "Limit Reached",
        description: "You can only generate 2 AI images per post.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      let prompt = '';
      
      // If user provided a custom prompt, use it as the primary prompt  
      if (imagePrompt.trim()) {
        prompt = imagePrompt.trim();
        
        // Only add context if the custom prompt doesn't seem complete
        if (editingPost?.industry && !imagePrompt.toLowerCase().includes(editingPost.industry.toLowerCase())) {
          prompt += `. Context: ${editingPost.industry} industry, Goal: ${editingPost.goal}`;
        }
      } else {
        // Default prompt if no custom prompt provided
        prompt = `Create a professional image for ${editingPost?.industry} industry. Goal: ${editingPost?.goal}. Caption: ${editingPost?.generatedContent?.caption}`;
      }

      // Add brand visual style and colors only when brand has data
      const brandHasData = brand && (brand.name || brand.tagline || brand.description || brand.voice_tone || brand.visual_style || brand.color_primary || brand.color_secondary || brand.logo_url);
      if (brandHasData && brand) {
        if (brand.visual_style && brand.visual_style !== 'clean-minimal') {
          prompt += `. Visual style: ${(brand.visual_style || '').replace(/-/g, ' ')}`;
        }
        if (brand.color_primary) prompt += `. Use brand primary color ${brand.color_primary}`;
        if (brand.color_secondary) prompt += ` and secondary color ${brand.color_secondary} in the design`;
      }
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          ...(includeExistingImage && content?.uploadedImage && {
            image: content.uploadedImage
          })
        }
      });

      if (error) throw error;

      let finalImage = data.image;

      // Apply logo overlay if brand has logo placement enabled
      if (brand?.logo_url && brand?.logo_placement && brand.logo_placement !== 'none') {
        try {
          const overlayBlob = await applyLogoOverlay({
            imageUrl: data.image,
            logoUrl: brand.logo_url,
            placement: brand.logo_placement as LogoPlacement,
            watermark: brand.watermark_enabled || false,
            watermarkOpacity: brand.watermark_opacity ?? 0.5,
          });
          // Convert blob back to data URL
          const reader = new FileReader();
          finalImage = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(overlayBlob);
          });
        } catch (overlayError) {
          console.error('Logo overlay failed, using original image:', overlayError);
        }
      }

      const isFirstGeneration = !content?.aiImage1;
      const newGenerationsCount = generationsCount + 1;
      const newPrompts = [...(content?.aiImagePrompts || []), prompt];

      const updatedContent = {
        ...content!,
        ...(isFirstGeneration ? { 
          aiImage1: finalImage,
          selectedImageType: 'ai_1' as const,
          image: finalImage
        } : { 
          aiImage2: finalImage,
          selectedImageType: 'ai_2' as const,
          image: finalImage
        }),
        aiGenerationsCount: newGenerationsCount,
        aiImagePrompts: newPrompts
      };

      onPostChange({
        ...editingPost!,
        generatedContent: updatedContent
      });

      toast({
        title: "Success",
        description: `AI image ${isFirstGeneration ? '1' : '2'} generated successfully!`,
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const modifyAIImage = async () => {
    const content = editingPost?.generatedContent;
    
    if (!content?.aiImage1 || !imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Need first AI image and modification requirements",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Use edit_image function to modify the existing AI image
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: imagePrompt,
          edit_image: true,
          image: content.aiImage1
        }
      });

      if (error) throw error;

      const updatedContent = {
        ...content,
        aiImage1: data.image,
        selectedImageType: 'ai_1' as const,
        image: data.image,
        aiImagePrompts: [...(content.aiImagePrompts || []), `Modified: ${imagePrompt}`]
      };

      onPostChange({
        ...editingPost!,
        generatedContent: updatedContent
      });

      toast({
        title: "Success",
        description: "AI Image 1 modified successfully!",
      });
    } catch (error) {
      console.error('Error modifying image:', error);
      toast({
        title: "Error",
        description: "Failed to modify AI image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageDelete = (imageType: 'uploaded' | 'ai_1' | 'ai_2') => {
    const content = editingPost?.generatedContent;
    if (!content) return;

    // Backup the deleted image
    setSelectedImageBackup({
      uploadedImage: content.uploadedImage,
      aiImage1: content.aiImage1,
      aiImage2: content.aiImage2
    });

    const updatedContent = { ...content };
    
    switch (imageType) {
      case 'uploaded':
        updatedContent.uploadedImage = undefined;
        break;
      case 'ai_1':
        updatedContent.aiImage1 = undefined;
        if (content.aiGenerationsCount) updatedContent.aiGenerationsCount -= 1;
        break;
      case 'ai_2':
        updatedContent.aiImage2 = undefined;
        if (content.aiGenerationsCount) updatedContent.aiGenerationsCount -= 1;
        break;
    }

    // If the deleted image was selected, reset selection
    if (content.selectedImageType === imageType) {
      updatedContent.selectedImageType = 'none';
      updatedContent.image = '';
    }

    onPostChange({
      ...editingPost!,
      generatedContent: updatedContent
    });
  };

  const handleImageRecover = (imageType: 'uploaded' | 'ai_1' | 'ai_2') => {
    if (!selectedImageBackup) return;

    const content = editingPost?.generatedContent;
    const updatedContent = { ...content! };

    switch (imageType) {
      case 'uploaded':
        if (selectedImageBackup.uploadedImage) {
          updatedContent.uploadedImage = selectedImageBackup.uploadedImage;
        }
        break;
      case 'ai_1':
        if (selectedImageBackup.aiImage1) {
          updatedContent.aiImage1 = selectedImageBackup.aiImage1;
          updatedContent.aiGenerationsCount = (content?.aiGenerationsCount || 0) + 1;
        }
        break;
      case 'ai_2':
        if (selectedImageBackup.aiImage2) {
          updatedContent.aiImage2 = selectedImageBackup.aiImage2;
          updatedContent.aiGenerationsCount = (content?.aiGenerationsCount || 0) + 1;
        }
        break;
    }

    onPostChange({
      ...editingPost!,
      generatedContent: updatedContent
    });

    setSelectedImageBackup(null);
  };

  if (!editingPost) return null;

  const content = editingPost.generatedContent;
  const canGenerateAI = (content?.aiGenerationsCount || 0) < 2;

  return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-post-description">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription id="edit-post-description">
                Edit your social media post content and schedule
              </DialogDescription>
            </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Business type</Label>
              <Select value={BUSINESS_TYPES.includes(editingPost.industry) ? editingPost.industry : 'Other'} onValueChange={(val) => {
                if (val === 'Other') {
                  onPostChange({ ...editingPost, industry: '' });
                } else {
                  onPostChange({ ...editingPost, industry: val });
                }
              }}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!BUSINESS_TYPES.includes(editingPost.industry) && (
                <Input
                  id="industry-other"
                  placeholder="Enter business type"
                  value={editingPost.industry}
                  onChange={(e) => onPostChange({ ...editingPost, industry: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                value={editingPost.goal}
                onChange={(e) => onPostChange({
                  ...editingPost,
                  goal: e.target.value
                })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="niche">Niche Info</Label>
            <Input
              id="niche"
              value={editingPost.nicheInfo}
              onChange={(e) => onPostChange({
                ...editingPost,
                nicheInfo: e.target.value
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Scheduled Date</Label>
              <Input
                id="date"
                type="date"
                value={editingPost.scheduledDate}
                onChange={(e) => onPostChange({
                  ...editingPost,
                  scheduledDate: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="time">Scheduled Time</Label>
              <Input
                id="time"
                type="time"
                value={editingPost.scheduledTime}
                onChange={(e) => onPostChange({
                  ...editingPost,
                  scheduledTime: e.target.value
                })}
              />
              {editingPost.scheduledDate && editingPost.scheduledTime && (
                <p className="text-xs text-gray-500 mt-1">
                  UTC: {editingPost.scheduledTime} (this is the time when the post will be published)
                </p>
              )}
            </div>
          </div>

          {/* Caption with Character Counter */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            {(() => {
              const platforms = editingPost.social_platforms || [];
              const captionLength = (content?.caption || '').length + (content?.hashtags?.join(' ').length || 0);
              const limitInfo = getLimitingPlatform(platforms);
              const limit = limitInfo?.limit || 63206;
              const colorClass = getCharacterCountColor(captionLength, limit);
              const showWarning = hasDifferentLimits(platforms);
              
              return (
                <>
                  {showWarning && (
                    <Alert className="mb-2 py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Selected platforms have different character limits. Content will be automatically truncated for platforms with lower limits.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Textarea
                    id="caption"
                    rows={4}
                    value={content?.caption || ''}
                    onChange={(e) => onPostChange({
                      ...editingPost,
                      generatedContent: {
                        ...content!,
                        caption: e.target.value
                      }
                    })}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${colorClass}`}>
                      {captionLength} / {limit} characters
                      {limitInfo && platforms.length > 1 && (
                        <span className="text-gray-500 ml-1">(limited by {limitInfo.name})</span>
                      )}
                    </span>
                    {captionLength > limit && (
                      <span className="text-xs text-red-600">Content will be truncated</span>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          <div>
            <Label htmlFor="hashtags">Hashtags (comma separated)</Label>
            <Input
              id="hashtags"
              value={content?.hashtags?.join(', ') || ''}
              onChange={(e) => onPostChange({
                ...editingPost,
                generatedContent: {
                  ...content!,
                  hashtags: e.target.value.split(',').map(tag => tag.trim())
                }
              })}
            />
          </div>

          {/* Image Management Section */}
          <div>
            <Label>Image Management</Label>
            
            {/* Current Selected Image Display */}
            {content?.image && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Currently Selected Image:</p>
                <div 
                  className="relative group cursor-pointer border rounded-lg overflow-hidden w-full h-32"
                  onClick={() => setShowFullImage(true)}
                >
                  <img 
                    src={content.image} 
                    alt="Selected content" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm">Click to view full size</span>
                  </div>
                </div>
              </div>
            )}

            {/* Image Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Uploaded Image */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Uploaded Image</h4>
                  {content?.selectedImageType === 'uploaded' && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                
                {content?.uploadedImage ? (
                  <div className="space-y-2">
                    <img src={content.uploadedImage} alt="Uploaded" className="w-full h-20 object-cover rounded" />
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant={content.selectedImageType === 'uploaded' ? 'default' : 'outline'}
                        onClick={() => updateImageSelection('uploaded')}
                        className="flex-1 text-xs"
                      >
                        Select
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImageDelete('uploaded')}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedImageBackup?.uploadedImage ? (
                      <Button size="sm" variant="outline" onClick={() => handleImageRecover('uploaded')}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Recover
                      </Button>
                    ) : (
                      <>
                        <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button size="sm" variant="outline" asChild className="w-full text-xs">
                            <span>
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* AI Image 1 */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">AI Image 1</h4>
                  {content?.selectedImageType === 'ai_1' && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                
                {content?.aiImage1 ? (
                  <div className="space-y-2">
                    <img src={content.aiImage1} alt="AI Generated 1" className="w-full h-20 object-cover rounded" />
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant={content.selectedImageType === 'ai_1' ? 'default' : 'outline'}
                        onClick={() => updateImageSelection('ai_1')}
                        className="flex-1 text-xs"
                      >
                        Select
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImageDelete('ai_1')}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedImageBackup?.aiImage1 ? (
                      <Button size="sm" variant="outline" onClick={() => handleImageRecover('ai_1')}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Recover
                      </Button>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">No AI Image 1</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Image 2 */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">AI Image 2</h4>
                  {content?.selectedImageType === 'ai_2' && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                
                {content?.aiImage2 ? (
                  <div className="space-y-2">
                    <img src={content.aiImage2} alt="AI Generated 2" className="w-full h-20 object-cover rounded" />
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant={content.selectedImageType === 'ai_2' ? 'default' : 'outline'}
                        onClick={() => updateImageSelection('ai_2')}
                        className="flex-1 text-xs"
                      >
                        Select
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImageDelete('ai_2')}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedImageBackup?.aiImage2 ? (
                      <Button size="sm" variant="outline" onClick={() => handleImageRecover('ai_2')}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Recover
                      </Button>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">No AI Image 2</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Image Generation Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="image-prompt">AI Image Requirements (Optional)</Label>
              <Textarea
                id="image-prompt"
                placeholder="Describe the image you want to generate..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={2}
              />
              
              <div className="flex flex-wrap gap-2">
                {/* Generate AI Image Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIImage(false)}
                  disabled={isGeneratingImage || !canGenerateAI}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isGeneratingImage ? 'Generating...' : 'Generate AI Image'}
                </Button>
                
                {/* AI + Original Image Button (only when uploaded image exists and can still generate) */}
                {content?.uploadedImage && canGenerateAI && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAIImage(true)}
                    disabled={isGeneratingImage}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    {isGeneratingImage ? 'Generating...' : 'AI + Original Image'}
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                AI generations used: {content?.aiGenerationsCount || 0}/2
                {!canGenerateAI && (
                  <span className="block mt-1 text-red-600">
                    Maximum AI image generations reached. You can still upload new images.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              console.log('Cancel clicked - restoring original state');
              console.log('Original state:', originalImageState);
              console.log('Current content before restore:', editingPost?.generatedContent);
              
              // Restore original image state on cancel without saving to DB
              if (originalImageState && editingPost) {
                const restoredContent = {
                  ...editingPost.generatedContent!,
                  uploadedImage: originalImageState.uploadedImage,
                  aiImage1: originalImageState.aiImage1,
                  aiImage2: originalImageState.aiImage2,
                  selectedImageType: originalImageState.selectedImageType || 'none',
                  aiGenerationsCount: originalImageState.aiGenerationsCount || 0,
                  image: originalImageState.selectedImageType === 'uploaded' ? originalImageState.uploadedImage : 
                         originalImageState.selectedImageType === 'ai_1' ? originalImageState.aiImage1 :
                         originalImageState.selectedImageType === 'ai_2' ? originalImageState.aiImage2 : ''
                };
                
                console.log('Restoring content to:', restoredContent);
                
                onPostChange({
                  ...editingPost,
                  generatedContent: restoredContent
                });
              }
              setSelectedImageBackup(null);
              onClose();
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Full Image View Modal - Single Close Button */}
          {showFullImage && content?.image && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowFullImage(false)}>
              <div className="relative max-w-4xl max-h-[90vh] p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullImage(false);
                  }}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <img 
                  src={content.image} 
                  alt="Full size view" 
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;