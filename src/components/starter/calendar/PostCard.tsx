
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, CheckCircle, Clock, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { format, isAfter, startOfMonth } from 'date-fns';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  status?: string;
  social_platforms?: string[];
  error_message?: string;
}

interface PostCardProps {
  post: PostData;
  onClick: (post: PostData) => void;
  onDelete: (post: PostData) => void;
}

// Platform icon components
const MastodonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const TwitterXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

// Get platform icon component
const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return Facebook;
    case 'twitter': 
    case 'x': return TwitterXIcon;
    case 'instagram': return Instagram;
    case 'linkedin': return Linkedin;
    case 'mastodon': return MastodonIcon;
    case 'telegram': return TelegramIcon;
    case 'tiktok': return TikTokIcon;
    default: return null;
  }
};

// Get platform brand color
const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return 'text-[#1877F2]';
    case 'twitter':
    case 'x': return 'text-black';
    case 'instagram': return 'text-[#E1306C]';
    case 'linkedin': return 'text-[#0A66C2]';
    case 'mastodon': return 'text-[#6364FF]';
    case 'telegram': return 'text-[#0088cc]';
    case 'tiktok': return 'text-black';
    default: return 'text-gray-600';
  }
};

// Get status badge config
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'draft':
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null, label: 'Draft' };
    case 'ready':
      return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Send, label: 'Ready' };
    case 'scheduled':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Scheduled' };
    case 'published':
      return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Published' };
    case 'failed':
      return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'Failed' };
    case 'rescheduled':
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: RefreshCw, label: 'Retrying' };
    default:
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null, label: status };
  }
};

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

  const statusConfig = getStatusConfig(post.status || 'draft');
  const StatusIcon = statusConfig.icon;

  return (
    <TooltipProvider>
      <div className={`border rounded-lg p-4 transition-colors w-full relative ${
        post.status === 'failed' ? 'border-red-200 bg-red-50/30' : 
        post.status === 'published' ? 'border-green-200 bg-green-50/30' :
        'hover:bg-gray-50'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Status Badge */}
            <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
              {statusConfig.label}
            </Badge>
            
            <Badge variant="secondary" className="text-xs">
              {post.industry}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {post.goal}
            </Badge>
            
            {/* Platform Icons */}
            {post.social_platforms && post.social_platforms.length > 0 && (
              <div className="flex items-center gap-1">
                {post.social_platforms.map((platform) => {
                  const IconComponent = getPlatformIcon(platform);
                  const isFailed = post.status === 'failed' || post.status === 'rescheduled';
                  return IconComponent ? (
                    <Tooltip key={platform}>
                      <TooltipTrigger asChild>
                        <span className={`${isFailed ? 'text-red-500' : getPlatformColor(platform)}`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="capitalize">{platform}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : null;
                })}
              </div>
            )}
            
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
            {post.status !== 'published' && (
              <>
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
              </>
            )}
          </div>
        </div>
        
        {/* Error message for failed posts */}
        {post.status === 'failed' && post.error_message && (
          <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {post.error_message}
          </div>
        )}
        
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
    </TooltipProvider>
  );
};

export default PostCard;
