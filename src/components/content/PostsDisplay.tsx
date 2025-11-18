import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Calendar,
  Clock,
  Copy,
  Download,
  Edit2,
  Trash2,
  AlertCircle,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const timeRemaining = isFreeUser ? getTimeRemaining(post.created_at) : null;
            const expiringSoon = isFreeUser ? isExpiringSoon(post.created_at) : false;
            
            return (
              <Card key={post.id} className={expiringSoon ? 'border-orange-300 bg-orange-50/30' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {post.industry || 'Social Media Post'}
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(post.generated_caption || '')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadPost(post.generated_caption || '')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    {post.created_at ? (
                      <>
                        <div>Created on {format(new Date(post.created_at), 'MMM dd, yyyy')}</div>
                        {isFreeUser && timeRemaining && (
                          <div className={`flex items-center ${expiringSoon ? 'text-orange-600 font-semibold' : 'text-blue-600'}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {timeRemaining}
                          </div>
                        )}
                      </>
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
                  {post.scheduled_date && post.scheduled_time && (
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="inline-block h-4 w-4 mr-1" />
                      Scheduled:{' '}
                      {format(new Date(post.scheduled_date), 'MMM dd, yyyy')}{' '}
                      <Clock className="inline-block h-4 w-4 mr-1" />
                      {format(new Date(`2000-01-01T${post.scheduled_time}`), 'h:mm a')}
                    </p>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEditPost(post)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
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