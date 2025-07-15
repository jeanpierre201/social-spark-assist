import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  Copy,
  Download,
  Edit2,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

interface PostsDisplayProps {
  posts: any[];
  onEditPost: (post: any) => void;
  onUpdatePost: (post: any, newContent: string) => void;
  onDeletePost: (id: string) => void;
}

const PostsDisplay = ({ posts, onEditPost, onUpdatePost, onDeletePost }: PostsDisplayProps) => {
  const { toast } = useToast();

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
      <h2 className="text-2xl font-bold text-foreground mb-4">Your Posts</h2>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts generated yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id}>
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
                <CardDescription>
                  {post.created_at ? (
                    <>Created on {format(new Date(post.created_at), 'MMM dd, yyyy')}</>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsDisplay;