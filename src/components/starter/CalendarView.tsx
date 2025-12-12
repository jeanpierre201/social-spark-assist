
import { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CalendarDisplay from './calendar/CalendarDisplay';
import PostsList from './calendar/PostsList';
// Use the main PostEditDialog which has proper platform selection and timezone handling
import PostEditDialog from './PostEditDialog';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
}

// PostData interface for calendar display
interface PostData {
  id?: string;
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
  created_at?: string;
  status?: string;
  social_platforms?: string[];
}

// Full Post interface matching the PostEditDialog requirements
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
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed';
  created_at: string;
  posted_at: string | null;
  error_message?: string | null;
}

interface CalendarViewProps {
  posts: PostData[];
  setViewMode: (mode: 'list' | 'calendar') => void;
  setPosts?: (posts: PostData[]) => void;
  onRefresh?: () => void;
}

const CalendarView = ({ posts, setViewMode, setPosts, onRefresh }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostData | null>(null);
  const { toast } = useToast();

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  // Handle post click for editing - fetch full post data from DB
  const handlePostClick = async (post: PostData) => {
    if (!post.id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', post.id)
        .single();
      
      if (error) throw error;
      
      setSelectedPost(data as Post);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      });
    }
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
      
      // Trigger refresh if provided
      onRefresh?.();

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

  // Handle post updated callback
  const handlePostUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedPost(null);
    // Trigger refresh if provided
    onRefresh?.();
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

      {/* Use the main PostEditDialog with proper props */}
      <PostEditDialog
        post={selectedPost}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onPostUpdated={handlePostUpdated}
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
