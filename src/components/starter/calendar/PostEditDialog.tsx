
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post changes",
        variant: "destructive",
      });
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
