
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { isSameDay } from 'date-fns';

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

interface CalendarDisplayProps {
  posts: PostData[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const CalendarDisplay = ({ posts, selectedDate, onDateSelect }: CalendarDisplayProps) => {
  // Get posts for a specific date
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

  // Custom day content to show post indicators
  const renderDayContent = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center">
        <span className="text-sm font-medium">{date.getDate()}</span>
        {dayPosts.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Schedule Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center w-full">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            className="rounded-md border w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full justify-center",
              month: "space-y-4 w-full max-w-none",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 h-16 font-normal text-sm flex items-center justify-center",
              row: "flex w-full mt-2",
              cell: "flex-1 h-20 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-20 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            }}
            modifiers={{
              hasPost: getDatesWithPosts()
            }}
            modifiersStyles={{
              hasPost: { 
                backgroundColor: '#e0f2fe', 
                fontWeight: 'bold'
              }
            }}
            components={{
              DayContent: ({ date }) => renderDayContent(date)
            }}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 rounded border"></div>
            <span>Days with scheduled posts</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full ml-4"></div>
            <span>Post indicator</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDisplay;
