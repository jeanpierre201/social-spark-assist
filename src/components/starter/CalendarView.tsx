
import { useState } from 'react';
import { isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CalendarDisplay from './calendar/CalendarDisplay';
import PostsList from './calendar/PostsList';
import PostEditDialog from './calendar/PostEditDialog';

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

interface CalendarViewProps {
  posts: PostData[];
  setViewMode: (mode: 'list' | 'calendar') => void;
  setPosts?: (posts: PostData[]) => void;
}

const CalendarView = ({ posts, setViewMode, setPosts }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostData | null>(null);
  const { toast } = useToast();

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  // Handle post click for editing
  const handlePostClick = (post: PostData) => {
    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  // Handle post deletion
  const handlePostDelete = (post: PostData) => {
    setPostToDelete(post);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!postToDelete?.id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete.id);

      if (error) throw error;

      // Update the posts list if setPosts is provided
      if (setPosts) {
        setPosts(posts.filter(post => post.id !== postToDelete.id));
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  // Handle saving post edits
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

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Calendar View</h3>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <CalendarDisplay 
          posts={posts}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      <div className="w-full">
        <PostsList
          selectedDate={selectedDate}
          posts={selectedDatePosts}
          onPostClick={handlePostClick}
          onPostDelete={handlePostDelete}
        />
      </div>

      <PostEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editingPost={editingPost}
        onPostChange={setEditingPost}
        onSave={handleSavePost}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              {postToDelete?.generatedContent?.caption && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Post preview:</strong> {postToDelete.generatedContent.caption.slice(0, 100)}...
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarView;
