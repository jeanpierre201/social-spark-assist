
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Hash, MessageSquare, Image as ImageIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

interface GeneratedPostsPreviewProps {
  posts: PostData[];
}

const GeneratedPostsPreview = ({ posts }: GeneratedPostsPreviewProps) => {
  const handleEdit = (postId?: string) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', postId);
  };

  const handleDelete = (postId?: string) => {
    // TODO: Implement delete functionality
    console.log('Delete post:', postId);
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Generated Posts
          </CardTitle>
          <CardDescription>Your AI-generated content will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No posts generated yet</p>
            <p className="text-sm text-gray-500">Use the form to create your first AI-generated post</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Generated Posts ({posts.length})</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {posts.map((post, index) => (
          <Card key={post.id || index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium">
                    {post.industry} - {post.goal}
                  </CardTitle>
                  {post.created_at && (
                    <CardDescription className="text-sm text-gray-500">
                      Created {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  )}
                </div>
                {post.id && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(post.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Industry and Goal */}
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {post.industry}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {post.goal}
                </Badge>
              </div>

              {/* Niche Info */}
              {post.nicheInfo && (
                <div>
                  <p className="text-sm text-gray-600 italic">"{post.nicheInfo}"</p>
                </div>
              )}

              {/* Generated Content */}
              {post.generatedContent && (
                <div className="space-y-3">
                  <Separator />
                  
                  {/* Caption */}
                  <div>
                    <div className="flex items-center mb-2">
                      <MessageSquare className="h-4 w-4 mr-1 text-blue-600" />
                      <span className="text-sm font-medium">Caption</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      {post.generatedContent.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {post.generatedContent.hashtags && post.generatedContent.hashtags.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Hash className="h-4 w-4 mr-1 text-green-600" />
                        <span className="text-sm font-medium">Hashtags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.generatedContent.hashtags.map((hashtag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-green-700 border-green-200">
                            #{hashtag.replace('#', '')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {post.generatedContent.image && (
                    <div>
                      <div className="flex items-center mb-2">
                        <ImageIcon className="h-4 w-4 mr-1 text-purple-600" />
                        <span className="text-sm font-medium">Generated Image</span>
                      </div>
                      <div className="relative">
                        <img 
                          src={post.generatedContent.image} 
                          alt="Generated content" 
                          className="w-full h-40 object-cover rounded border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Scheduling Info */}
              {(post.scheduledDate || post.scheduledTime) && (
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex items-center space-x-4 text-sm">
                    {post.scheduledDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{format(new Date(post.scheduledDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {post.scheduledTime && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{post.scheduledTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GeneratedPostsPreview;
