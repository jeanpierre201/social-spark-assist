
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import PostCard from './PostCard';

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

interface PostsListProps {
  selectedDate: Date | undefined;
  posts: PostData[];
  onPostClick: (post: PostData) => void;
  onPostDelete: (post: PostData) => void;
}

const PostsList = ({ selectedDate, posts, onPostClick, onPostDelete }: PostsListProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Posts for {selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <div className="flex flex-col gap-4 w-full">
            {posts.map((post, index) => (
              <PostCard
                key={post.id || index}
                post={post}
                onClick={onPostClick}
                onDelete={onPostDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium">No posts scheduled</p>
            <p className="text-sm">
              {selectedDate ? 'for this date' : 'Select a date to view scheduled posts'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostsList;
