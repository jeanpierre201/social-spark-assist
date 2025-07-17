import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Save, Eye } from 'lucide-react';
import { format } from 'date-fns';

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published' | 'archived'
  });

  const isEditable = post?.status === 'draft' || post?.status === 'scheduled';
  const isReadOnly = !isEditable;

  useEffect(() => {
    if (post) {
      setFormData({
        caption: post.generated_caption,
        hashtags: post.generated_hashtags.join(' '),
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '',
        status: post.status
      });
    }
  }, [post]);

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
                onValueChange={(value: 'draft' | 'scheduled') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
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