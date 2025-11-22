import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, Eye, Calendar, Filter, ChevronLeft, ChevronRight, Trash2, List, Calendar as CalendarIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, startOfMonth, isSameDay } from 'date-fns';
import CalendarDisplay from '@/components/starter/calendar/CalendarDisplay';
import PostsList from '@/components/starter/calendar/PostsList';
import PostEditDialog from '@/components/starter/PostEditDialog';
import { useManualPublish } from '@/hooks/useManualPublish';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';

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
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed';
  created_at: string;
  posted_at: string | null;
  error_message?: string | null;
}

interface PostData {
  id?: string;
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: {
    caption: string;
    hashtags: string[];
    image?: string;
  };
  created_at?: string;
}

type ViewMode = 'list' | 'calendar';

interface ProPostsSectionProps {
  onEditPost: (post: any) => void;
  onUpdatePost: (post: any, newContent: string) => void;
  onDeletePost: (id: string) => void;
}

const ProPostsSection = ({ onEditPost, onUpdatePost, onDeletePost }: ProPostsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { publishToFacebook, isPublishingPost } = useManualPublish();
  const { accounts } = useSocialAccounts();
  const [posts, setPosts] = useState<Post[]>([]);
  const [transformedPosts, setTransformedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const postsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, currentPage, searchTerm, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`generated_caption.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%,goal.ilike.%${searchTerm}%`);
      }

      // Apply pagination for list view
      if (viewMode === 'list') {
        const from = (currentPage - 1) * postsPerPage;
        const to = from + postsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const postsData = (data || []) as any[];
      // Transform to match our Post interface
      const typedPosts: Post[] = postsData.map(post => ({
        id: post.id,
        industry: post.industry,
        goal: post.goal,
        niche_info: post.niche_info,
        generated_caption: post.generated_caption,
        generated_hashtags: post.generated_hashtags || [],
        media_url: post.media_url,
        uploaded_image_url: post.uploaded_image_url || null,
        ai_generated_image_1_url: post.ai_generated_image_1_url || null,
        ai_generated_image_2_url: post.ai_generated_image_2_url || null,
        selected_image_type: post.selected_image_type || null,
        scheduled_date: post.scheduled_date,
        scheduled_time: post.scheduled_time,
        user_timezone: post.user_timezone || null,
        social_platforms: post.social_platforms || [],
        status: post.status,
        created_at: post.created_at,
        posted_at: post.posted_at,
        error_message: post.error_message || null
      }));
      
      setPosts(typedPosts);
      setTotalPages(Math.ceil((count || 0) / postsPerPage));

      // Transform posts for calendar view
      const transformed = typedPosts.map(post => ({
        id: post.id,
        industry: post.industry,
        goal: post.goal,
        nicheInfo: post.niche_info || '',
        scheduledDate: post.scheduled_date,
        scheduledTime: post.scheduled_time,
        generatedContent: {
          caption: post.generated_caption,
          hashtags: post.generated_hashtags || [],
          image: post.media_url,
        },
        created_at: post.created_at
      }));
      setTransformedPosts(transformed);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
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

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const isEditable = (status: string) => {
    // Failed and rescheduled posts should be editable so users can reschedule them
    return status === 'draft' || status === 'scheduled' || status === 'rescheduled' || status === 'failed';
  };

  const isFromPreviousPeriod = (createdAt: string) => {
    const postCreatedDate = new Date(createdAt);
    const currentMonthStart = startOfMonth(new Date());
    return isAfter(currentMonthStart, postCreatedDate);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
  };

  const confirmDelete = async () => {
    if (!postToDelete?.id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete.id);

      if (error) throw error;

      onDeletePost(postToDelete.id);
      setPosts(posts.filter(p => p.id !== postToDelete.id));
      setTransformedPosts(transformedPosts.filter(p => p.id !== postToDelete.id));

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setPostToDelete(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  // Calendar view specific functions
  const getPostsForDate = (date: Date) => {
    return transformedPosts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  const handlePostClick = (post: PostData) => {
    // Find the original post to get all fields
    const originalPost = posts.find(p => p.id === post.id);
    if (originalPost) {
      setEditingPost(originalPost);
      setIsEditDialogOpen(true);
    }
  };

  const handleCalendarDelete = (post: PostData) => {
    const originalPost = posts.find(p => p.id === post.id);
    if (originalPost) {
      handleDeletePost(originalPost);
    }
  };

  const handleListPostEdit = (post: Post) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handlePostUpdated = () => {
    fetchPosts();
    setIsEditDialogOpen(false);
    setEditingPost(null);
  };

  // Manual publish to Facebook
  const handleManualPublish = async (post: Post) => {
    const facebookAccount = accounts.find(acc => acc.platform === 'facebook' && acc.is_active);
    
    if (!facebookAccount) {
      toast({
        title: 'No Facebook Account',
        description: 'Please connect your Facebook account first',
        variant: 'destructive',
      });
      return;
    }

    const message = `${post.generated_caption}\n\n${post.generated_hashtags.join(' ')}`;
    const result = await publishToFacebook(
      post.id,
      facebookAccount.id,
      message,
      post.media_url || undefined
    );

    if (result.success) {
      // Refresh posts to show updated status
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              Your Posts
            </CardTitle>
            <CardDescription>
              Manage and view all your generated content
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-1"
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center space-x-1"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === 'list' ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {post.industry}
                        </span>
                        {isFromPreviousPeriod(post.created_at) && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
                            <Calendar className="h-3 w-3 mr-1" />
                            Previous Period
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1">
                        {truncateText(post.goal, 80)}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {truncateText(post.generated_caption, 120)}
                      </p>
                      
                      {post.media_url && (
                        <div className="mb-2">
                          <img 
                            src={post.media_url} 
                            alt="Generated content" 
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                        {post.scheduled_date && (
                          <span>Scheduled: {format(new Date(post.scheduled_date), 'MMM dd, yyyy')} at {post.scheduled_time || '00:00'}</span>
                        )}
                        {post.posted_at && (
                          <span>Posted: {format(new Date(post.posted_at), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {/* Post Now button for scheduled/failed posts */}
                      {(post.status === 'scheduled' || post.status === 'failed' || post.status === 'rescheduled') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleManualPublish(post)}
                          disabled={isPublishingPost(post.id)}
                          className="bg-green-600 hover:bg-green-700"
                          title="Post Now to Facebook"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {isEditable(post.status) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListPostEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListPostEdit(post)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post)}
                        className="hover:bg-red-50 hover:border-red-200"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first post to get started'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Calendar View */
          <div className="space-y-6 w-full">
            <div className="w-full max-w-4xl mx-auto">
              <CalendarDisplay 
                posts={transformedPosts}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            <div className="w-full">
              <PostsList
                selectedDate={selectedDate}
                posts={selectedDatePosts}
                onPostClick={handlePostClick}
                onPostDelete={handleCalendarDelete}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
                {postToDelete && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Post preview:</strong> {postToDelete.generated_caption.slice(0, 100)}...
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

        {/* Edit Dialog - Using Starter Plan Dialog */}
        <PostEditDialog
          post={editingPost}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onPostUpdated={handlePostUpdated}
        />
      </CardContent>
    </Card>
  );
};

export default ProPostsSection;