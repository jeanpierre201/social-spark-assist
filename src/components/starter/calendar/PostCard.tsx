
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { format, isAfter, startOfMonth, endOfMonth } from 'date-fns';

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

interface PostCardProps {
  post: PostData;
  onClick: (post: PostData) => void;
  onDelete: (post: PostData) => void;
}

const PostCard = ({ post, onClick, onDelete }: PostCardProps) => {
  // Determine if post is from previous subscription period
  const isFromPreviousPeriod = () => {
    if (!post.created_at) return false;
    const postCreatedDate = new Date(post.created_at);
    const currentMonthStart = startOfMonth(new Date());
    return isAfter(currentMonthStart, postCreatedDate);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(post);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(post);
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors w-full relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {post.industry}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {post.goal}
          </Badge>
          {isFromPreviousPeriod() && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
              <Calendar className="h-3 w-3 mr-1" />
              Previous Period
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {post.scheduledTime && (
            <span className="text-sm text-gray-500 mr-2">
              {post.scheduledTime} UTC
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
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
          {post.generatedContent.image && (
            <div className="mt-2">
              <img 
                src={post.generatedContent.image} 
                alt="Post media" 
                className="w-full h-32 object-cover rounded border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
