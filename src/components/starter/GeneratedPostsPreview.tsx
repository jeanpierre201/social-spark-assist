
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download } from 'lucide-react';

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image?: string;
}

interface PostData {
  industry: string;
  goal: string;
  nicheInfo: string;
  scheduledDate?: string;
  scheduledTime?: string;
  generatedContent?: GeneratedContent;
}

interface GeneratedPostsPreviewProps {
  posts: PostData[];
}

const GeneratedPostsPreview = ({ posts }: GeneratedPostsPreviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 text-green-600 mr-2" />
          Generated Posts ({posts.length})
        </CardTitle>
        <CardDescription>
          Your generated content ready for scheduling
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {posts.map((post, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {post.industry}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Calendar className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {post.generatedContent && (
                  <>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {post.generatedContent.caption}
                    </p>
                    <p className="text-xs text-blue-600">
                      {post.generatedContent.hashtags.slice(0, 3).join(' ')}...
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No posts generated yet. Create your first post!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratedPostsPreview;
