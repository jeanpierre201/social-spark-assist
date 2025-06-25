
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, List, Clock } from 'lucide-react';
import { useState } from 'react';
import { format, isSameDay } from 'date-fns';

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

interface CalendarViewProps {
  posts: PostData[];
  setViewMode: (mode: 'list' | 'calendar') => void;
}

const CalendarView = ({ posts, setViewMode }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get posts for the selected date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  // Get dates that have scheduled posts
  const getDatesWithPosts = () => {
    return posts
      .filter(post => post.scheduledDate)
      .map(post => new Date(post.scheduledDate!));
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Calendar View</h3>
        <Button 
          variant="outline" 
          onClick={() => setViewMode('list')}
          className="flex items-center space-x-2"
        >
          <List className="h-4 w-4" />
          <span>Switch to List View</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Schedule Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasPost: getDatesWithPosts()
              }}
              modifiersStyles={{
                hasPost: { 
                  backgroundColor: '#3b82f6', 
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Days with scheduled posts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600" />
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDatePosts.length > 0 ? (
              <div className="space-y-4">
                {selectedDatePosts.map((post, index) => (
                  <div key={post.id || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.industry}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {post.goal}
                        </Badge>
                      </div>
                      {post.scheduledTime && (
                        <span className="text-sm text-gray-500">
                          {post.scheduledTime}
                        </span>
                      )}
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
                      </div>
                    )}
                  </div>
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
      </div>
    </div>
  );
};

export default CalendarView;
