
import { useState } from 'react';
import { isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Calendar View</h3>
      </div>

      <CalendarDisplay 
        posts={posts}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      <PostsList
        selectedDate={selectedDate}
        posts={selectedDatePosts}
        onPostClick={handlePostClick}
      />

      <PostEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editingPost={editingPost}
        onPostChange={setEditingPost}
        onSave={handleSavePost}
      />
    </div>
  );
};

export default CalendarView;
