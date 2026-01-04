import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, Eye, Calendar, Filter, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Send, RefreshCw, AlertCircle, Facebook, Twitter, Instagram, Linkedin, CheckCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, startOfMonth, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useManualPublish } from '@/hooks/useManualPublish';
import { useOptionalSocialAccounts } from '@/hooks/useSocialAccounts';
import { useMastodonPublish } from '@/hooks/useMastodonPublish';

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
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'archived' | 'rescheduled' | 'failed';
  created_at: string;
  posted_at: string | null;
  error_message?: string | null;
  social_platforms?: string[] | null;
}

interface PostsListProps {
  onEditPost: (post: Post) => void;
  refreshTrigger?: number;
  subscriptionStartDate?: string | null;
  canCreatePosts?: boolean;
}

const PostsList = ({ onEditPost, refreshTrigger, subscriptionStartDate, canCreatePosts }: PostsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { publishToFacebook, publishToTwitter, publishToMastodon, isPublishingPost } = useManualPublish();
  const socialContext = useOptionalSocialAccounts();
  const accounts = socialContext?.accounts ?? [];
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const postsPerPage = 10;

  // Real-time subscription for post status updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('posts-status-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          // Update single post in local state instead of full refresh
          setPosts(prev => prev.map(p => 
            p.id === payload.new.id ? { ...p, ...payload.new as Post } : p
          ));
        }
      )
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
    toast({
      description: "Posts refreshed",
    });
  };

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

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const isEditable = (status: string) => {
    // Failed and ready posts should be editable
    return status === 'draft' || status === 'ready' || status === 'scheduled' || status === 'rescheduled' || status === 'failed';
  };

  // Check if post can have "Post Now" button - only ready and scheduled posts (have platforms selected)
  // Disabled when subscription period is expired
  const canPostNowCheck = (post: Post) => {
    if (canCreatePosts === false) return false; // Disable when expired
    const hasPlatforms = post.social_platforms && post.social_platforms.length > 0;
    return hasPlatforms && (post.status === 'ready' || post.status === 'scheduled');
  };

  // Get failed platforms from social_platforms array
  const getFailedPlatforms = (post: Post) => {
    if (post.status !== 'failed' && post.status !== 'rescheduled') return [];
    return post.social_platforms || [];
  };

  // Mastodon icon component
  const MastodonIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
    </svg>
  );

  // Get platform icon component
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'mastodon': return MastodonIcon;
      default: return null;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return CheckCircle;
      case 'scheduled': return Clock;
      case 'failed': return AlertTriangle;
      case 'rescheduled': return RefreshCw;
      case 'ready': return Send;
      default: return null;
    }
  };

  // Check if a scheduled post is overdue
  const isOverdue = (post: Post) => {
    if (post.status !== 'scheduled' || !post.scheduled_date || !post.scheduled_time) {
      return false;
    }
    
    // Post times are stored in UTC
    const scheduledDateTime = new Date(`${post.scheduled_date}T${post.scheduled_time}:00Z`);
    const now = new Date();
    const gracePeriodMinutes = 15;
    
    // Check if post is overdue by more than grace period
    return now > addMinutes(scheduledDateTime, gracePeriodMinutes);
  };

  // Check if post is from previous subscription period (subscription period context)
  const isFromPreviousPeriod = (createdAt: string) => {
    if (!subscriptionStartDate) return false;
    
    const postCreatedDate = new Date(createdAt);
    const subscriptionStart = new Date(subscriptionStartDate);
    
    // If post was created before the current subscription period, it's from previous period
    return postCreatedDate < subscriptionStart;
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

  // Manual publish to social media
  const handleManualPublish = async (post: Post) => {
    // Get the platforms selected for this specific post
    const selectedPlatforms = (post.social_platforms as string[]) || [];
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No Platforms Selected',
        description: 'Please select at least one platform for this post',
        variant: 'destructive',
      });
      return;
    }

    // Find connected accounts for selected platforms only
    const facebookAccount = selectedPlatforms.includes('facebook') 
      ? accounts.find(acc => acc.platform === 'facebook' && acc.is_active)
      : null;
    const twitterAccount = (selectedPlatforms.includes('twitter') || selectedPlatforms.includes('x'))
      ? accounts.find(acc => acc.platform === 'twitter' && acc.is_active)
      : null;
    const mastodonAccount = selectedPlatforms.includes('mastodon')
      ? accounts.find(acc => acc.platform === 'mastodon' && acc.is_active)
      : null;
    
    // Check if at least one selected platform has a connected account
    const hasConnectedAccount = 
      (selectedPlatforms.includes('facebook') && facebookAccount) ||
      ((selectedPlatforms.includes('twitter') || selectedPlatforms.includes('x')) && twitterAccount) ||
      (selectedPlatforms.includes('mastodon') && mastodonAccount);
    
    if (!hasConnectedAccount) {
      const missingPlatforms = selectedPlatforms.filter(p => {
        if (p === 'facebook') return !facebookAccount;
        if (p === 'twitter' || p === 'x') return !twitterAccount;
        if (p === 'mastodon') return !mastodonAccount;
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

    // Only publish to platforms that are selected AND connected
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

    if (mastodonAccount && selectedPlatforms.includes('mastodon')) {
      const result = await publishToMastodon(
        post.id,
        message,
        post.media_url || undefined
      );
      results.push({ platform: 'Mastodon', ...result });
    }

    // Refresh posts to show updated status/errors
    fetchPosts();
  };

  // Retry all failed posts
  const handleRetryAllFailed = async () => {
    const failedPosts = posts.filter(p => p.status === 'failed' || p.status === 'rescheduled');
    
    if (failedPosts.length === 0) {
      toast({
        description: "No failed posts to retry",
      });
      return;
    }

    setRetryingAll(true);
    let successCount = 0;
    let errorCount = 0;

    for (const post of failedPosts) {
      try {
        await handleManualPublish(post);
        successCount++;
      } catch (error) {
        console.error('Error retrying post:', post.id, error);
        errorCount++;
      }
    }

    setRetryingAll(false);
    
    toast({
      title: "Bulk Retry Complete",
      description: `Retried ${failedPosts.length} posts. Check individual posts for results.`,
    });
    
    fetchPosts();
  };

  // Count failed posts for the button
  const failedPostsCount = posts.filter(p => p.status === 'failed' || p.status === 'rescheduled').length;

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
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          {failedPostsCount > 0 && canCreatePosts !== false && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryAllFailed}
                    disabled={retryingAll}
                    className="shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {retryingAll ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Retry All ({failedPostsCount})
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Retry publishing all failed posts at once
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
                    {isOverdue(post) && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Overdue - Check connection
                      </Badge>
                    )}
                    {post.status === 'rescheduled' && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200 bg-yellow-50">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retrying soon
                      </Badge>
                    )}
                    {/* Show selected platforms with status indicators */}
                    {post.social_platforms && post.social_platforms.length > 0 && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          {post.social_platforms.map((platform) => {
                            const IconComponent = getPlatformIcon(platform);
                            const normalizedPlatform = platform.toLowerCase();
                            
                            // Determine per-platform status
                            let platformStatus: 'pending' | 'success' | 'failed' = 'pending';
                            
                            if (post.status === 'published') {
                              platformStatus = 'success';
                            } else if (post.status === 'failed' || post.status === 'rescheduled') {
                              // Check if error message mentions this specific platform
                              const errorLower = (post.error_message || '').toLowerCase();
                              const platformNames = [normalizedPlatform];
                              if (normalizedPlatform === 'x') platformNames.push('twitter');
                              if (normalizedPlatform === 'twitter') platformNames.push('x');
                              
                              const mentionsPlatform = platformNames.some(name => 
                                errorLower.includes(name)
                              );
                              
                              // If error doesn't mention specific platforms or mentions this one, mark as failed
                              // If error mentions other platforms but not this one, assume this one succeeded
                              if (mentionsPlatform || !errorLower) {
                                platformStatus = 'failed';
                              } else {
                                // Check if the error is generic (applies to all) or platform-specific
                                const isGenericError = !['facebook', 'twitter', 'x', 'instagram', 'mastodon', 'telegram', 'linkedin'].some(
                                  p => errorLower.includes(p)
                                );
                                platformStatus = isGenericError ? 'failed' : 'success';
                              }
                            }
                            
                            // Determine styling based on status
                            let colorClass = getPlatformColor(platform);
                            let StatusIcon = null;
                            let statusTooltip = platform;
                            
                            if (platformStatus === 'success') {
                              colorClass = 'bg-green-100 text-green-700 border-green-300';
                              StatusIcon = CheckCircle;
                              statusTooltip = `${platform}: Published`;
                            } else if (platformStatus === 'failed') {
                              colorClass = 'text-red-600 border-red-200 bg-red-50';
                              StatusIcon = AlertTriangle;
                              statusTooltip = `${platform}: Failed`;
                            }
                            
                            return (
                              <Tooltip key={platform}>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className={`text-xs px-1.5 flex items-center gap-0.5 ${colorClass}`}>
                                    {IconComponent ? <IconComponent className="h-3 w-3" /> : <span className="capitalize">{platform}</span>}
                                    {StatusIcon && <StatusIcon className="h-2.5 w-2.5 ml-0.5" />}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="capitalize">{statusTooltip}</span>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">
                    {truncateText(post.goal, 80)}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {truncateText(post.generated_caption, 120)}
                  </p>
                  
                  {/* Display AI-generated image thumbnail */}
                  {post.media_url && (
                    <div className="mb-2">
                      <img 
                        src={post.media_url} 
                        alt="Generated content" 
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                      {(() => {
                        const created = post.created_at ? new Date(post.created_at) : null;
                        if (!created || isNaN(created.getTime())) return 'Created: N/A';
                        return `Created: ${format(created, 'MMM dd, yyyy')}`;
                      })()}
                    </span>
                    {post.scheduled_date && post.scheduled_time && (() => {
                      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      const utcDateTimeStr = `${post.scheduled_date}T${post.scheduled_time}:00Z`;
                      const utcDate = new Date(utcDateTimeStr);
                      if (isNaN(utcDate.getTime())) return null;
                      const localDate = toZonedTime(utcDate, userTimezone);
                      return (
                        <span>
                          Scheduled: {format(localDate, 'MMM dd, yyyy')} at {format(localDate, 'HH:mm')}{' '}
                          <span className="text-gray-400">(UTC: {post.scheduled_time})</span>
                        </span>
                      );
                    })()}
                    {post.posted_at && (() => {
                      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      const postedDate = new Date(post.posted_at);
                      if (isNaN(postedDate.getTime())) return null;
                      const localPostedDate = toZonedTime(postedDate, userTimezone);
                      return (
                        <span>Posted: {format(localPostedDate, 'MMM dd, yyyy')} at {format(localPostedDate, 'HH:mm')}</span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 sm:pt-0 sm:ml-4 border-t sm:border-t-0 mt-2 sm:mt-0">
                  {/* Post Now button for ready/scheduled posts with platforms */}
                  {canPostNowCheck(post) && (
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
                  
                  {isEditable(post.status) && canCreatePosts !== false ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPost(post)}
                      title="Edit Post"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPost(post)}
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
                    {canCreatePosts !== false && (
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
                    )}
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