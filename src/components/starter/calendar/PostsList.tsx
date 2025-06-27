
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
}

const PostsList = ({ selectedDate, posts, onPostClick }: PostsListProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Posts for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
            {posts.map((post, index) => (
              <PostCard
                key={post.id || index}
                post={post}
                onClick={onPostClick}
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
