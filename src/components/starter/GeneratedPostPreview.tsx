import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Check, Copy, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  generated_caption?: string;
  generated_hashtags?: string[];
  media_url?: string;
  created_at?: string;
}

interface GeneratedPostPreviewProps {
  post: PostData;
  onClose: () => void;
  onViewAllPosts: () => void;
}

const GeneratedPostPreview = ({ post, onClose, onViewAllPosts }: GeneratedPostPreviewProps) => {
  const { toast } = useToast();

  const caption = post.generatedContent?.caption || post.generated_caption || '';
  const hashtags = post.generatedContent?.hashtags || post.generated_hashtags || [];
  const imageUrl = post.generatedContent?.image || post.media_url;

  const handleCopyCaption = () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Copied!",
      description: "Caption and hashtags copied to clipboard",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg">Post Created!</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{post.industry}</Badge>
              <Badge variant="outline">{post.goal}</Badge>
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={imageUrl} 
                  alt="Post image" 
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            {!imageUrl && (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Caption Preview */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-4">{caption}</p>
              {hashtags.length > 0 && (
                <p className="text-sm text-purple-600 mt-2 line-clamp-2">
                  {hashtags.slice(0, 5).join(' ')}
                  {hashtags.length > 5 && ` +${hashtags.length - 5} more`}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={handleCopyCaption}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Caption & Hashtags
            </Button>
            <Button 
              onClick={onViewAllPosts}
              className="w-full flex items-center gap-2"
            >
              View All Posts
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Create Another Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedPostPreview;
