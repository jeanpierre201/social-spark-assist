
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Hash, MessageSquare, Image as ImageIcon, Edit, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
  isGenerated?: boolean;
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

interface GeneratedPostsPreviewProps {
  posts: PostData[];
  setPosts?: (posts: PostData[]) => void;
}

const GeneratedPostsPreview = ({ posts, setPosts }: GeneratedPostsPreviewProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const { toast } = useToast();

  const handleEdit = (post: PostData) => {
    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  const handleSavePost = async () => {
    if (!editingPost || !editingPost.id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          industry: editingPost.industry,
          goal: editingPost.goal,
          niche_info: editingPost.nicheInfo,
          scheduled_date: editingPost.scheduledDate,
          scheduled_time: editingPost.scheduledTime,
          generated_caption: editingPost.generatedContent?.caption,
          generated_hashtags: editingPost.generatedContent?.hashtags,
          media_url: editingPost.generatedContent?.image
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      // Update the posts list if setPosts is provided
      if (setPosts) {
        setPosts(posts.map(post => 
          post.id === editingPost.id ? editingPost : post
        ));
      }

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId?: string) => {
    if (!postId) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Update the posts list if setPosts is provided
      if (setPosts) {
        setPosts(posts.filter(post => post.id !== postId));
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Generated Posts
          </CardTitle>
          <CardDescription>Your AI-generated content will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No posts generated yet</p>
            <p className="text-sm text-gray-500">Use the form to create your first AI-generated post</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Generated Posts ({posts.length})</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {posts.map((post, index) => (
          <Card key={post.id || index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium">
                    {post.industry} - {post.goal}
                  </CardTitle>
                  {post.created_at && (
                    <CardDescription className="text-sm text-gray-500">
                      Created {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  )}
                </div>
                {post.id && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(post)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Industry and Goal */}
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {post.industry}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {post.goal}
                </Badge>
              </div>

              {/* Niche Info */}
              {post.nicheInfo && (
                <div>
                  <p className="text-sm text-gray-600 italic">"{post.nicheInfo}"</p>
                </div>
              )}

              {/* Generated Content */}
              {post.generatedContent && (
                <div className="space-y-3">
                  <Separator />
                  
                  {/* Caption */}
                  <div>
                    <div className="flex items-center mb-2">
                      <MessageSquare className="h-4 w-4 mr-1 text-blue-600" />
                      <span className="text-sm font-medium">Caption</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      {post.generatedContent.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {post.generatedContent.hashtags && post.generatedContent.hashtags.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Hash className="h-4 w-4 mr-1 text-green-600" />
                        <span className="text-sm font-medium">Hashtags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.generatedContent.hashtags.map((hashtag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-green-700 border-green-200">
                            #{hashtag.replace('#', '')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {post.generatedContent.image && (
                    <div>
                      <div className="flex items-center mb-2">
                        <ImageIcon className="h-4 w-4 mr-1 text-purple-600" />
                        <span className="text-sm font-medium">
                          {post.generatedContent.isGenerated ? 'Generated Image' : 'Uploaded Image'}
                        </span>
                      </div>
                      <div className="relative">
                        <img 
                          src={post.generatedContent.image} 
                          alt="Content media" 
                          className="w-full h-40 object-cover rounded border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Scheduling Info */}
              {(post.scheduledDate || post.scheduledTime) && (
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex items-center space-x-4 text-sm">
                    {post.scheduledDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{format(new Date(post.scheduledDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {post.scheduledTime && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{post.scheduledTime} UTC</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={editingPost.industry}
                    onChange={(e) => setEditingPost({
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
                    onChange={(e) => setEditingPost({
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
                  onChange={(e) => setEditingPost({
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
                    onChange={(e) => setEditingPost({
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
                    onChange={(e) => setEditingPost({
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
                  onChange={(e) => setEditingPost({
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
                  onChange={(e) => setEditingPost({
                    ...editingPost,
                    generatedContent: {
                      ...editingPost.generatedContent!,
                      hashtags: e.target.value.split(',').map(tag => tag.trim())
                    }
                  })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSavePost}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneratedPostsPreview;
