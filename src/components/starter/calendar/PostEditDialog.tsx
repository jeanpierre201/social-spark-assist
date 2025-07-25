import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X, Upload, ImageIcon, Wand2, Edit, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePostsManager } from '@/hooks/usePostsManager';
import { useState } from 'react';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
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
  const [showFullImage, setShowFullImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingEditedImage, setIsGeneratingEditedImage] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [deletedImageBackup, setDeletedImageBackup] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editingPost?.id) return;
    
    try {
      await updatePostMutation.mutateAsync({
        id: editingPost.id,
        industry: editingPost.industry,
        goal: editingPost.goal,
        niche_info: editingPost.nicheInfo,
        content: editingPost.generatedContent?.caption || '',
        hashtags: editingPost.generatedContent?.hashtags || [],
        scheduled_date: editingPost.scheduledDate,
        scheduled_time: editingPost.scheduledTime,
        media_url: editingPost.generatedContent?.image
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onPostChange({
        ...editingPost!,
        generatedContent: {
          ...editingPost!.generatedContent!,
          image: publicUrl
        }
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const generateAIImage = async (includeExistingImage: boolean = false) => {
    if (hasGeneratedOnce) {
      toast({
        title: "Limit Reached",
        description: "You can only generate one AI image per post.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = `${imagePrompt || `Create a professional image for ${editingPost?.industry} industry. Goal: ${editingPost?.goal}. Caption: ${editingPost?.generatedContent?.caption}`}`;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          ...(includeExistingImage && editingPost?.generatedContent?.image && {
            image: editingPost.generatedContent.image
          })
        }
      });

      if (error) throw error;

      onPostChange({
        ...editingPost!,
        generatedContent: {
          ...editingPost!.generatedContent!,
          image: data.image
        }
      });

      setHasGeneratedOnce(true);
      toast({
        title: "Success",
        description: "AI image generated successfully!",
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

  const handleImageDelete = () => {
    if (editingPost?.generatedContent?.image) {
      setDeletedImageBackup(editingPost.generatedContent.image);
      onPostChange({
        ...editingPost,
        generatedContent: {
          ...editingPost.generatedContent,
          image: undefined
        }
      });
    }
  };

  const handleImageRecover = () => {
    if (deletedImageBackup) {
      onPostChange({
        ...editingPost!,
        generatedContent: {
          ...editingPost!.generatedContent!,
          image: deletedImageBackup
        }
      });
      setDeletedImageBackup(null);
    }
  };

  if (!editingPost) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={editingPost.industry}
                onChange={(e) => onPostChange({
                  ...editingPost,
                  industry: e.target.value
                })}
              />
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
              <Label htmlFor="time">Scheduled Time (UTC)</Label>
              <Input
                id="time"
                type="time"
                value={editingPost.scheduledTime}
                onChange={(e) => onPostChange({
                  ...editingPost,
                  scheduledTime: e.target.value
                })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              rows={4}
              value={editingPost.generatedContent?.caption || ''}
              onChange={(e) => onPostChange({
                ...editingPost,
                generatedContent: {
                  ...editingPost.generatedContent!,
                  caption: e.target.value
                }
              })}
            />
          </div>

          <div>
            <Label htmlFor="hashtags">Hashtags (comma separated)</Label>
            <Input
              id="hashtags"
              value={editingPost.generatedContent?.hashtags?.join(', ') || ''}
              onChange={(e) => onPostChange({
                ...editingPost,
                generatedContent: {
                  ...editingPost.generatedContent!,
                  hashtags: e.target.value.split(',').map(tag => tag.trim())
                }
              })}
            />
          </div>

          {/* Image Section */}
          <div>
            <Label>Post Image</Label>
            {editingPost.generatedContent?.image ? (
              <div className="space-y-2">
                <div 
                  className="relative group cursor-pointer border rounded-lg overflow-hidden"
                  onClick={() => setShowFullImage(true)}
                >
                  <img 
                    src={editingPost.generatedContent.image} 
                    alt="Generated content" 
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm">Click to view full size</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImageDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {deletedImageBackup && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImageRecover}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Recover Image
                  </Button>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No image added</p>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AI Image Generation Section */}
            <div className="space-y-3 mt-4">
              <Label htmlFor="image-prompt">AI Image Description (Optional)</Label>
              <Textarea
                id="image-prompt"
                placeholder="Describe the image you want to generate or modifications you'd like to make..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={2}
              />
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIImage(false)}
                  disabled={isGeneratingImage || hasGeneratedOnce}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isGeneratingImage ? 'Generating...' : 'Generate AI Image'}
                </Button>
                
                {editingPost.generatedContent?.image && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAIImage(true)}
                    disabled={isGeneratingImage || hasGeneratedOnce}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isGeneratingImage ? 'Generating...' : 'Enhance with AI'}
                  </Button>
                )}
              </div>
              
              {hasGeneratedOnce && (
                <p className="text-xs text-gray-500">
                  AI image generation is limited to once per post to preserve resources.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Full Image View Modal - NO DELETE ICON */}
          {showFullImage && editingPost.generatedContent?.image && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowFullImage(false)}>
              <div className="relative max-w-4xl max-h-[90vh] p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullImage(false);
                  }}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <img 
                  src={editingPost.generatedContent.image} 
                  alt="Generated content" 
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