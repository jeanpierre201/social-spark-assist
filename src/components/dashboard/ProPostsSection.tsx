import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, Eye, FileText, Calendar, Filter, ChevronLeft, ChevronRight, Trash2, List, Calendar as CalendarIcon, Send, RefreshCw, AlertCircle, Facebook, Twitter, Instagram, Linkedin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, startOfMonth, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed' | 'partially_published';
  created_at: string;
  updated_at: string | null;
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
  status?: string;
}

type ViewMode = 'list' | 'calendar';

interface ProPostsSectionProps {
  onEditPost: (post: any) => void;
  onUpdatePost: (post: any, newContent: string) => void;
  onDeletePost: (id: string) => void;
  canCreatePosts?: boolean;
}

const ProPostsSection = ({ onEditPost, onUpdatePost, onDeletePost, canCreatePosts = true }: ProPostsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { publishToFacebook, publishToTwitter, publishToMastodon, publishToTelegram, isPublishingPost } = useManualPublish();
  const { accounts } = useSocialAccounts();
  const [posts, setPosts] = useState<Post[]>([]);
  const [transformedPosts, setTransformedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'updated_at' | 'scheduled_date'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const postsPerPage = 10;

  // Real-time subscription for post status updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('pro-posts-status-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          setPosts(prev => prev.map(p => {
            if (p.id !== payload.new.id) return p;
            const next = payload.new as Partial<Post>;
            return {
              ...p,
              ...next,
              media_url: (next.media_url ?? p.media_url) as any,
              uploaded_image_url: (next.uploaded_image_url ?? p.uploaded_image_url) as any,
              social_platforms: (Array.isArray(next.social_platforms) ? next.social_platforms : (p.social_platforms ?? [])) as any,
              generated_hashtags: (Array.isArray(next.generated_hashtags) ? next.generated_hashtags : p.generated_hashtags) as any,
              generated_caption: (next.generated_caption ?? p.generated_caption) as any,
            } as Post;
          }));
        }
      )
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, currentPage, searchTerm, statusFilter, sortField, sortOrder]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id)
        .order(sortField, { ascending: sortOrder === 'asc' });

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
        updated_at: post.updated_at || null,
        posted_at: post.posted_at,
        error_message: post.error_message || null
      }));
      
      setPosts(typedPosts);
      setTotalPages(Math.ceil((count || 0) / postsPerPage));

      // Transform posts for calendar view
      const transformed = typedPosts.map(post => {
        // Convert UTC scheduled_date+time to user's local date for calendar placement
        let localScheduledDate = post.scheduled_date || post.posted_at || post.created_at;
        if (post.scheduled_date && post.scheduled_time) {
          try {
            const tz = post.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const utcDateTimeStr = `${post.scheduled_date}T${post.scheduled_time}Z`;
            const localDate = toZonedTime(utcDateTimeStr, tz);
            if (!isNaN(localDate.getTime())) {
              localScheduledDate = format(localDate, 'yyyy-MM-dd');
            }
          } catch (e) {
            console.error('Error converting scheduled date to local:', e);
          }
        } else if (post.posted_at) {
          try {
            const tz = post.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const localDate = toZonedTime(new Date(post.posted_at), tz);
            if (!isNaN(localDate.getTime())) {
              localScheduledDate = format(localDate, 'yyyy-MM-dd');
            }
          } catch (e) { /* fallback to raw value */ }
        }

        return {
          id: post.id,
          industry: post.industry,
          goal: post.goal,
          nicheInfo: post.niche_info || '',
          scheduledDate: localScheduledDate,
          scheduledTime: post.scheduled_time,
          generatedContent: {
            caption: post.generated_caption,
            hashtags: post.generated_hashtags || [],
            image: post.media_url,
          },
          created_at: post.created_at,
          status: post.status
        };
      });
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
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get platform brand color for badges
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-[#1877F2] text-white border-[#1877F2]';
      case 'twitter': return 'bg-black text-white border-black';
      case 'instagram': return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white border-[#E1306C]';
      case 'linkedin': return 'bg-[#0A66C2] text-white border-[#0A66C2]';
      case 'tiktok': return 'bg-black text-white border-black';
      case 'snapchat': return 'bg-[#FFFC00] text-black border-[#FFFC00]';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get platform icon component
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      default: return null;
    }
  };

  // Check if post can have "Post Now" button - only ready and scheduled posts (have platforms selected)
  // Disabled when subscription period is expired
  const canPostNow = (post: Post) => {
    if (!canCreatePosts) return false; // Disable when expired
    const hasPlatforms = post.social_platforms && post.social_platforms.length > 0;
    return hasPlatforms && (post.status === 'ready' || post.status === 'scheduled');
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const isEditable = (status: string) => {
    // Failed, ready, and rescheduled posts should be editable
    return status === 'draft' || status === 'ready' || status === 'scheduled' || status === 'rescheduled' || status === 'failed';
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
    toast({ description: "Posts refreshed" });
  };

  const handlePostUpdated = async () => {
    fetchPosts();
    // Re-fetch the editing post to update the dialog with fresh data (e.g. new AI image)
    if (editingPost?.id) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', editingPost.id)
          .single();
        
        if (!error && data) {
          const normalizedPost = {
            ...data,
            social_platforms: Array.isArray(data.social_platforms) ? data.social_platforms : [],
            generated_hashtags: Array.isArray(data.generated_hashtags) ? data.generated_hashtags : [],
            generated_caption: data.generated_caption || '',
          } as Post;
          setEditingPost(normalizedPost);
        }
      } catch (err) {
        console.error('Error re-fetching post:', err);
      }
    }
  };

  // Manual publish to social platforms
  const handleManualPublish = async (post: Post) => {
    const selectedPlatforms = (post.social_platforms as string[]) || [];
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No Platforms Selected',
        description: 'Please select at least one platform for this post',
        variant: 'destructive',
      });
      return;
    }

    // Find connected accounts for selected platforms
    const mastodonAccount = selectedPlatforms.includes('mastodon')
      ? accounts.find(acc => acc.platform === 'mastodon' && acc.is_active)
      : null;
    const telegramAccount = selectedPlatforms.includes('telegram')
      ? accounts.find(acc => acc.platform === 'telegram' && acc.is_active)
      : null;
    const facebookAccount = selectedPlatforms.includes('facebook') 
      ? accounts.find(acc => acc.platform === 'facebook' && acc.is_active)
      : null;
    const twitterAccount = (selectedPlatforms.includes('twitter') || selectedPlatforms.includes('x'))
      ? accounts.find(acc => (acc.platform === 'twitter' || acc.platform === 'x') && acc.is_active)
      : null;
    
    // Check if at least one selected platform has a connected account
    const hasConnectedAccount = 
      (selectedPlatforms.includes('mastodon') && mastodonAccount) ||
      (selectedPlatforms.includes('telegram') && telegramAccount) ||
      (selectedPlatforms.includes('facebook') && facebookAccount) ||
      ((selectedPlatforms.includes('twitter') || selectedPlatforms.includes('x')) && twitterAccount);
    
    if (!hasConnectedAccount) {
      const missingPlatforms = selectedPlatforms.filter(p => {
        if (p === 'mastodon') return !mastodonAccount;
        if (p === 'telegram') return !telegramAccount;
        if (p === 'facebook') return !facebookAccount;
        if (p === 'twitter' || p === 'x') return !twitterAccount;
        return true;
      });
      toast({
        title: 'Account Not Connected',
        description: `Please connect your ${missingPlatforms.join(', ')} account(s) first`,
        variant: 'destructive',
      });
      return;
    }

    const message = `${post.generated_caption}\n\n${post.generated_hashtags.join(' ')}`;
    const results = [];

    if (mastodonAccount && selectedPlatforms.includes('mastodon')) {
      const result = await publishToMastodon(
        post.id,
        message,
        post.media_url || undefined
      );
      results.push({ platform: 'Mastodon', ...result });
    }

    if (telegramAccount && selectedPlatforms.includes('telegram')) {
      const result = await publishToTelegram(
        post.id,
        message,
        post.media_url || undefined
      );
      results.push({ platform: 'Telegram', ...result });
    }

    if (facebookAccount && selectedPlatforms.includes('facebook')) {
      const result = await publishToFacebook(
        post.id,
        facebookAccount.id,
        message,
        post.media_url || undefined
      );
      results.push({ platform: 'Facebook', ...result });
    }

    if (twitterAccount && (selectedPlatforms.includes('twitter') || selectedPlatforms.includes('x'))) {
      const result = await publishToTwitter(
        post.id,
        twitterAccount.id,
        message
      );
      results.push({ platform: 'Twitter', ...result });
    }

    // Refresh posts to show updated status/errors
    fetchPosts();
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
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Manage Posts
          </CardTitle>
          <CardDescription>
            Manage and view all your generated content
          </CardDescription>
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 w-fit">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-1 h-8 px-2.5"
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center space-x-1 h-8 px-2.5"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewMode === 'list' ? (
          <>
            {/* Search + Refresh row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh posts"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Filters row - single line */}
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="partially_published">Partial</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rescheduled">Retrying</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortField} onValueChange={(val) => setSortField(val as any)}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="scheduled_date">Scheduled Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`border rounded-lg p-3 sm:p-4 transition-colors ${post.status === 'failed' ? 'border-red-200 bg-red-50/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getStatusColor(post.status)}>
                          {post.status === 'partially_published' ? 'Partial' : post.status === 'rescheduled' ? 'Retrying' : post.status}
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
                        {post.status === 'rescheduled' && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200 bg-yellow-50">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retrying soon
                          </Badge>
                        )}
                        {/* Show selected platforms with brand colors */}
                        {post.social_platforms && post.social_platforms.length > 0 && (
                          <div className="flex items-center gap-1">
                            {post.social_platforms.map((platform) => {
                              const IconComponent = getPlatformIcon(platform);
                              const isFailed = post.status === 'failed' || post.status === 'rescheduled';
                              const colorClass = isFailed 
                                ? 'text-red-600 border-red-200 bg-red-50' 
                                : getPlatformColor(platform);
                              return (
                                <Badge key={platform} variant="outline" className={`text-xs px-1.5 ${colorClass}`}>
                                  {IconComponent ? <IconComponent className="h-3 w-3" /> : <span className="capitalize">{platform}</span>}
                                </Badge>
                              );
                            })}
                          </div>
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
                    
                    <div className="flex flex-wrap gap-2 pt-2 sm:pt-0 sm:ml-4 border-t sm:border-t-0 mt-2 sm:mt-0">
                      {/* Post Now button for ready/scheduled posts with platforms */}
                      {canPostNow(post) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleManualPublish(post)}
                          disabled={isPublishingPost(post.id)}
                          className="bg-green-600 hover:bg-green-700"
                          title="Post Now"
                        >
                          {isPublishingPost(post.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {isEditable(post.status) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListPostEdit(post)}
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListPostEdit(post)}
                          title="View Post"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post)}
                        className="hover:bg-red-50 hover:border-red-200"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Error Section - Displayed at bottom of card for failed posts */}
                  {(post.status === 'failed' || post.status === 'rescheduled') && post.error_message && (
                    <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        <div className="font-medium text-red-800 mb-1">
                          {post.status === 'failed' ? 'Publishing Failed' : 'Temporarily Failed - Will Retry'}
                        </div>
                        <p className="text-sm text-red-700 whitespace-pre-wrap">{post.error_message}</p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => handleManualPublish(post)}
                            disabled={isPublishingPost(post.id)}
                          >
                            {isPublishingPost(post.id) ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry Now
                              </>
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
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