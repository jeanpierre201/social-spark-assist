import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, Eye, Calendar, Filter, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, startOfMonth } from 'date-fns';

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

interface PostsListProps {
  onEditPost: (post: Post) => void;
  refreshTrigger?: number;
}

const PostsList = ({ onEditPost, refreshTrigger }: PostsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const postsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, currentPage, searchTerm, statusFilter, refreshTrigger]);

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

      // Apply pagination
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setPosts((data || []) as Post[]);
      setTotalPages(Math.ceil((count || 0) / postsPerPage));
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
    return status === 'draft' || status === 'scheduled';
  };

  // Check if post is from previous subscription period
  const isFromPreviousPeriod = (createdAt: string) => {
    const postCreatedDate = new Date(createdAt);
    const currentMonthStart = startOfMonth(new Date());
    return isAfter(currentMonthStart, postCreatedDate);
  };

  // Handle post deletion
  const handleDeletePost = (post: Post) => {
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

      // Remove from local state
      setPosts(posts.filter(p => p.id !== postToDelete.id));

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setPostToDelete(null);
      
      // Refresh the posts to update pagination
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 text-purple-600 mr-2" />
          Your Posts
        </CardTitle>
        <CardDescription>
          Manage and view all your generated content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                    {post.scheduled_date && (
                      <span>Scheduled: {format(new Date(post.scheduled_date), 'MMM dd, yyyy')}</span>
                    )}
                    {post.posted_at && (
                      <span>Posted: {format(new Date(post.posted_at), 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {isEditable(post.status) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPost(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPost(post)}
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
      </CardContent>
    </Card>
  );
};

export default PostsList;