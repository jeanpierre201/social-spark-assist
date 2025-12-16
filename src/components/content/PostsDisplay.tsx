import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useManualPublish } from '@/hooks/useManualPublish';
import { 
  Calendar,
  Clock,
  Copy,
  Download,
  Edit2,
  Trash2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

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
  const { publishToMastodon, isPublishingPost } = useManualPublish();
  const isFreeUser = !subscribed;
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
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
    
    return hoursRemaining <= 3; // Less than 3 hours remaining
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

  const handlePostNow = async (post: any) => {
    const selectedPlatforms = post.social_platforms || [];
    
    // Check for Mastodon
    const hasMastodon = selectedPlatforms.includes('mastodon');
    const mastodonAccount = accounts.find(acc => acc.platform === 'mastodon' && acc.is_active);

    if (hasMastodon && mastodonAccount) {
      const message = `${post.generated_caption}\n\n${(post.generated_hashtags || []).map((h: string) => `#${h}`).join(' ')}`;
      await publishToMastodon(post.id, message, post.media_url);
    } else if (hasMastodon && !mastodonAccount) {
      toast({
        title: 'Mastodon not connected',
        description: 'Please connect your Mastodon account first',
        variant: 'destructive',
      });
    }

    // Telegram would need a separate edge function - placeholder for now
    if (selectedPlatforms.includes('telegram')) {
      toast({
        title: 'Telegram',
        description: 'Telegram posting coming soon!',
      });
    }
  };

  const canPostNow = (post: any) => {
    const platforms = post.social_platforms || [];
    return platforms.some((p: string) => {
      if (p === 'mastodon') return accounts.some(acc => acc.platform === 'mastodon' && acc.is_active);
      return false;
    });
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
                  {/* Platform badges and status */}
                  <div className="flex items-center gap-2 mt-2">
                    {post.social_platforms && post.social_platforms.length > 0 && (
                      <div className="flex gap-1">
                        {post.social_platforms.map((platform: string) => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {post.status === 'published' && (
                      <Badge className="bg-green-500 text-white">
                        ✓ Published
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 mt-3 pt-3 border-t">
                    {post.status !== 'published' && canPostNow(post) && (
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