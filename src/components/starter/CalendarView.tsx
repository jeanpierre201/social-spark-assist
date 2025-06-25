
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, Edit, Save, X } from 'lucide-react';
import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

const CalendarView = ({ posts, setViewMode }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const { toast } = useToast();

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  // Get dates that have scheduled posts
  const getDatesWithPosts = () => {
    return posts
      .filter(post => post.scheduledDate)
      .map(post => new Date(post.scheduledDate!));
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

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingPost(null);
      // Refresh posts would need to be implemented by parent component
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

  // Custom day content to show post previews
  const renderDayContent = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    
    return (
      <div className="w-full h-full relative">
        <span className="text-sm">{date.getDate()}</span>
        {dayPosts.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            {dayPosts.slice(0, 2).map((post, idx) => (
              <div
                key={post.id || idx}
                className="bg-blue-100 text-blue-800 text-xs px-1 rounded mb-1 cursor-pointer hover:bg-blue-200 truncate"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostClick(post);
                }}
              >
                {post.generatedContent?.caption?.slice(0, 15) || 'Post'}...
              </div>
            ))}
            {dayPosts.length > 2 && (
              <div className="bg-gray-100 text-gray-600 text-xs px-1 rounded">
                +{dayPosts.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Calendar View</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Schedule Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasPost: getDatesWithPosts()
              }}
              modifiersStyles={{
                hasPost: { 
                  backgroundColor: '#e0f2fe', 
                  fontWeight: 'bold'
                }
              }}
              components={{
                DayContent: ({ date }) => renderDayContent(date)
              }}
            />
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 rounded border"></div>
                <span>Days with scheduled posts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600" />
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDatePosts.length > 0 ? (
              <div className="space-y-4">
                {selectedDatePosts.map((post, index) => (
                  <div 
                    key={post.id || index} 
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.industry}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {post.goal}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {post.scheduledTime && (
                          <span className="text-sm text-gray-500">
                            {post.scheduledTime}
                          </span>
                        )}
                        <Edit className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    
                    {post.generatedContent && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {post.generatedContent.caption}
                        </p>
                        {post.generatedContent.hashtags && post.generatedContent.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.generatedContent.hashtags.slice(0, 3).map((hashtag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs text-green-700 border-green-200">
                                #{hashtag.replace('#', '')}
                              </Badge>
                            ))}
                            {post.generatedContent.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.generatedContent.hashtags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">No posts scheduled</p>
                <p className="text-sm">
                  {selectedDate ? 'for this date' : 'Select a date to view scheduled posts'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
                  <Label htmlFor="time">Scheduled Time</Label>
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

export default CalendarView;
