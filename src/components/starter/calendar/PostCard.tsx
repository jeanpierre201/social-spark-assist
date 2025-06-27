
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';

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
}

const PostCard = ({ post, onClick }: PostCardProps) => {
  return (
    <div 
      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors w-full"
      onClick={() => onClick(post)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {post.industry}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {post.goal}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {post.scheduledTime && (
            <span className="text-sm text-gray-500">
              {post.scheduledTime} UTC
            </span>
          )}
          <Edit className="h-4 w-4 text-blue-600" />
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
