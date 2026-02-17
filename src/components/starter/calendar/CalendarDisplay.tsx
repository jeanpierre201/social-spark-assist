
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
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
  status?: string;
}

interface CalendarDisplayProps {
  posts: PostData[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

// Get status dot color
const getStatusDotColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-400';
    case 'ready': return 'bg-purple-500';
    case 'scheduled': return 'bg-blue-500';
    case 'published': return 'bg-green-500';
    case 'partially_published': return 'bg-emerald-400';
    case 'failed': return 'bg-red-500';
    case 'rescheduled': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

// Get status background highlight for calendar cells
const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'draft': return '#f3f4f6';
    case 'ready': return '#faf5ff';
    case 'scheduled': return '#eff6ff';
    case 'published': return '#f0fdf4';
    case 'partially_published': return '#ecfdf5';
    case 'failed': return '#fef2f2';
    case 'rescheduled': return '#fefce8';
    default: return '#f9fafb';
  }
};

const CalendarDisplay = ({ posts, selectedDate, onDateSelect }: CalendarDisplayProps) => {
  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      if (!post.scheduledDate) return false;
      const scheduledDate = new Date(post.scheduledDate);
      if (isNaN(scheduledDate.getTime())) return false;
      return isSameDay(scheduledDate, date);
    });
  };

  // Get dates that have scheduled posts
  const getDatesWithPosts = () => {
    return posts
      .filter(post => post.scheduledDate)
      .map(post => new Date(post.scheduledDate!))
      .filter(d => !isNaN(d.getTime()));
  };

  // Custom day content to show post indicators with status colors
  const renderDayContent = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    
    // Group posts by status for display
    const statusCounts: Record<string, number> = {};
    dayPosts.forEach(post => {
      const status = post.status || 'draft';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center text-inherit">
        <span className="text-sm font-medium text-inherit">{date.getDate()}</span>
        {dayPosts.length > 0 && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5 flex-wrap">
            {Object.entries(statusCounts).slice(0, 4).map(([status, count], idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(status)} ring-1 ring-white`}
                title={`${count} ${status}`}
              />
            ))}
            {Object.keys(statusCounts).length > 4 && (
              <div className="w-2.5 h-2.5 rounded-full bg-muted ring-1 ring-white" title="More posts" />
            )}
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
              day: "h-20 w-full p-0 font-normal aria-selected:opacity-100 aria-selected:bg-primary aria-selected:text-primary-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            }}
            modifiers={{
              hasPost: getDatesWithPosts()
            }}
            modifiersStyles={{
              hasPost: { 
                backgroundColor: '#f0f9ff', 
                fontWeight: 'bold'
              }
            }}
            components={{
              DayContent: ({ date }) => renderDayContent(date)
            }}
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
              <span>Draft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <span>Published</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
              <span>Retrying</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDisplay;
