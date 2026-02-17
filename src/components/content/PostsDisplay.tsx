import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useManualPublish } from '@/hooks/useManualPublish';
import type { PlatformResults } from '@/hooks/useManualPublish';
import { PlatformIcon } from '@/components/PlatformIcon';
import { 
  Calendar,
  Clock,
  Copy,
  Download,
  Edit2,
  Trash2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PostsDisplayProps {
  posts: any[];
  onEditPost: (post: any) => void;
  onUpdatePost: (post: any, newContent: string) => void;
  onDeletePost: (id: string) => void;
}

const PostsDisplay = ({ posts, onEditPost, onUpdatePost, onDeletePost }: PostsDisplayProps) => {
  const { toast } = useToast();
  const { subscribed } = useSubscription();
  const { accounts } = useSocialAccounts();
  const { publishToMastodon, publishToTelegram, publishToFacebook, publishToTwitter, publishToInstagram, isPublishingPost } = useManualPublish();
  const isFreeUser = !subscribed;
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const now = currentTime;
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const isExpiringSoon = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const now = currentTime;
    const diff = expiresAt.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    return hoursRemaining <= 3;
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Post copied to clipboard!",
    });
  };

  const handleDownloadPost = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "social-post.txt";
    document.body.appendChild(element);
    element.click();
  };

  const buildMessage = (post: any, platform: string) => {
    const caption = post.generated_caption || '';
    const hashtags = (post.generated_hashtags || []).map((h: string) => `#${h}`).join(' ');
    // Telegram doesn't use hashtags
    if (platform === 'telegram') return caption;
    return `${caption}\n\n${hashtags}`.trim();
  };

  const publishToPlatform = async (post: any, platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    const account = accounts.find(acc => acc.platform === normalizedPlatform && acc.is_active);
    
    if (!account) {
      toast({
        title: `${platform} not connected`,
        description: `Please connect your ${platform} account first`,
        variant: 'destructive',
      });
      return;
    }

    const message = buildMessage(post, normalizedPlatform);

    switch (normalizedPlatform) {
      case 'mastodon':
        await publishToMastodon(post.id, message, post.media_url);
        break;
      case 'telegram':
        await publishToTelegram(post.id, message, post.media_url);
        break;
      case 'facebook':
        await publishToFacebook(post.id, account.id, message, post.media_url);
        break;
      case 'twitter':
      case 'x':
        await publishToTwitter(post.id, account.id, message);
        break;
      case 'instagram':
        await publishToInstagram(post.id, account.id, message, post.media_url);
        break;
      default:
        toast({
          title: 'Unsupported platform',
          description: `Publishing to ${platform} is not yet supported`,
          variant: 'destructive',
        });
    }
  };

  const handlePostNow = async (post: any) => {
    const selectedPlatforms: string[] = post.social_platforms || [];
    
    for (const platform of selectedPlatforms) {
      const normalizedPlatform = platform.toLowerCase();
      // Skip already-published platforms
      const platformResults = (post.platform_results as PlatformResults) || {};
      if (platformResults[normalizedPlatform]?.status === 'success') continue;
      
      await publishToPlatform(post, normalizedPlatform);
    }
  };

  const handleRetryFailed = async (post: any) => {
    const platformResults = (post.platform_results as PlatformResults) || {};
    const selectedPlatforms: string[] = post.social_platforms || [];
    
    for (const platform of selectedPlatforms) {
      const normalizedPlatform = platform.toLowerCase();
      if (platformResults[normalizedPlatform]?.status === 'failed') {
        await publishToPlatform(post, normalizedPlatform);
      }
    }
  };

  const getFailedPlatforms = (post: any): string[] => {
    const platformResults = (post.platform_results as PlatformResults) || {};
    const selectedPlatforms: string[] = post.social_platforms || [];
    return selectedPlatforms.filter(p => platformResults[p.toLowerCase()]?.status === 'failed');
  };

  const canPostNow = (post: any) => {
    const platforms: string[] = post.social_platforms || [];
    return platforms.some((p: string) => {
      const normalized = p.toLowerCase();
      return accounts.some(acc => acc.platform === normalized && acc.is_active);
    });
  };

  const getPlatformStatusColor = (platform: string, post: any): string => {
    const platformResults = (post.platform_results as PlatformResults) || {};
    const result = platformResults[platform.toLowerCase()];
    if (!result) return 'text-muted-foreground';
    if (result.status === 'success') return 'text-green-600';
    if (result.status === 'failed') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getPlatformTooltip = (platform: string, post: any): string => {
    const platformResults = (post.platform_results as PlatformResults) || {};
    const result = platformResults[platform.toLowerCase()];
    if (!result) return `${platform}: pending`;
    if (result.status === 'success') return `${platform}: Published${result.published_at ? ` at ${format(new Date(result.published_at), 'MMM dd, h:mm a')}` : ''}`;
    if (result.status === 'failed') return `${platform}: Failed — ${result.error || 'Unknown error'}`;
    return `${platform}: ${result.status}`;
  };

  return (
    <div data-posts-section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Your Posts</h2>
        {isFreeUser && posts.length > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Free Plan: Posts visible for 24 hours
          </Badge>
        )}
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts generated yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {posts.map((post) => {
            const timeRemaining = isFreeUser ? getTimeRemaining(post.created_at) : null;
            const expiringSoon = isFreeUser ? isExpiringSoon(post.created_at) : false;
            const failedPlatforms = getFailedPlatforms(post);
            const isPartiallyPublished = post.status === 'partially_published';
            
            return (
              <Card key={post.id} className={expiringSoon ? 'border-orange-300 bg-orange-50/30' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-base sm:text-lg truncate">{post.industry || 'Social Media Post'}</span>
                    <div className="flex space-x-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyToClipboard(post.generated_caption || '')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPost(post.generated_caption || '')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    {post.created_at ? (
                      (() => {
                        const created = new Date(post.created_at);
                        if (isNaN(created.getTime())) return <div>Created: N/A</div>;
                        return (
                          <>
                            <div>Created on {format(created, 'MMM dd, yyyy')}</div>
                            {isFreeUser && timeRemaining && (
                              <div className={`flex items-center ${expiringSoon ? 'text-orange-600 font-semibold' : 'text-blue-600'}`}>
                                <Clock className="h-3 w-3 mr-1" />
                                {timeRemaining}
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      'Recently created'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{post.generated_caption || 'No caption available'}</p>
                  {post.generated_hashtags && post.generated_hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.generated_hashtags.map((hashtag: string, index: number) => (
                        <span key={index} className="text-blue-500 text-sm">
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  )}
                  {post.media_url && (
                    <img src={post.media_url} alt="Post" className="max-h-48 w-full object-cover rounded-md mt-2" />
                  )}
                  {post.scheduled_date && post.scheduled_time && (() => {
                    const dateOnly = new Date(post.scheduled_date);
                    const timeOnly = new Date(`2000-01-01T${post.scheduled_time}`);
                    if (isNaN(dateOnly.getTime()) || isNaN(timeOnly.getTime())) return null;
                    return (
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="inline-block h-4 w-4 mr-1" />
                        Scheduled: {format(dateOnly, 'MMM dd, yyyy')} <Clock className="inline-block h-4 w-4 mr-1" />
                        {format(timeOnly, 'h:mm a')}
                      </p>
                    );
                  })()}

                  {/* Per-platform status badges */}
                  <div className="flex items-center gap-3 mt-2">
                    {post.social_platforms && post.social_platforms.length > 0 && (
                      <TooltipProvider>
                        <div className="flex gap-2 items-center">
                          {(post.social_platforms as string[]).map((platform: string) => {
                            const statusColor = getPlatformStatusColor(platform, post);
                            const tooltip = getPlatformTooltip(platform, post);
                            const platformResults = (post.platform_results as PlatformResults) || {};
                            const result = platformResults[platform.toLowerCase()];
                            const isSuccess = result?.status === 'success';
                            const isFailed = result?.status === 'failed';
                            
                            return (
                              <Tooltip key={platform}>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    isSuccess 
                                      ? 'bg-green-50 border-green-300 text-green-700' 
                                      : isFailed 
                                        ? 'bg-red-50 border-red-300 text-red-700'
                                        : 'bg-muted border-border text-muted-foreground'
                                  }`}>
                                    <PlatformIcon 
                                      platform={platform} 
                                      size={14} 
                                      className={statusColor}
                                    />
                                    <span className="capitalize">{platform === 'x' ? 'X' : platform}</span>
                                    {isSuccess && <span>✓</span>}
                                    {isFailed && <span>✗</span>}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="text-xs">{tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    )}
                    {post.status === 'published' && (
                      <Badge className="bg-green-500 text-white">
                        ✓ Published
                      </Badge>
                    )}
                    {isPartiallyPublished && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        ⚠ Partially Published
                      </Badge>
                    )}
                    {post.status === 'failed' && (
                      <Badge variant="destructive">
                        ✗ Failed
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 mt-3 pt-3 border-t">
                    {/* Retry Failed Platforms button for partially_published or failed posts */}
                    {(isPartiallyPublished || post.status === 'failed') && failedPlatforms.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRetryFailed(post)}
                        disabled={isPublishingPost(post.id)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isPublishingPost(post.id) ? 'Retrying...' : `Retry Failed (${failedPlatforms.length})`}
                      </Button>
                    )}
                    {post.status !== 'published' && post.status !== 'partially_published' && canPostNow(post) && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handlePostNow(post)}
                        disabled={isPublishingPost(post.id)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isPublishingPost(post.id) ? 'Posting...' : 'Post Now'}
                      </Button>
                    )}
                    {post.status !== 'published' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditPost(post)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostsDisplay;
