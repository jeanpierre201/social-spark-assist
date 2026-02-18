
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, 
  TrendingUp,
  Calendar,
  Target,
  Users,
  Crown
} from 'lucide-react';

interface QuickStatsProps {
  isProUser: boolean;
  isStarterUser: boolean;
  subscribed: boolean;
  totalPosts: number;
  currentMonthPosts: number;
  avgEngagementRate: string | null;
  totalScheduledPosts: number;
  totalFollowers: number;
  teamMembersCount?: number;
}

const QuickStats = ({ 
  isProUser, 
  isStarterUser, 
  subscribed,
  totalPosts,
  currentMonthPosts,
  avgEngagementRate,
  totalScheduledPosts,
  totalFollowers,
  teamMembersCount = 0
}: QuickStatsProps) => {
  if (!subscribed) return null;

  const cardClassName = isProUser 
    ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" 
    : isStarterUser 
      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" 
      : "";

  const iconClassName = isProUser 
    ? 'text-purple-600' 
    : isStarterUser 
      ? 'text-blue-600' 
      : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
          <Sparkles className={`h-4 w-4 ${iconClassName}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMonthPosts || '--'}</div>
          <p className="text-xs text-muted-foreground">
            {isProUser 
              ? `${currentMonthPosts}/100 this month`
              : isStarterUser 
                ? `${currentMonthPosts}/10 this month`
                : 'No posts yet'
            }
          </p>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <TrendingUp className={`h-4 w-4 ${iconClassName}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgEngagementRate ? `${avgEngagementRate}%` : '--'}</div>
          <p className="text-xs text-muted-foreground">
            {avgEngagementRate ? 'Average across platforms' : 'No data available'}
          </p>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
          <Calendar className={`h-4 w-4 ${iconClassName}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalScheduledPosts || '--'}</div>
          <p className="text-xs text-muted-foreground">
            {totalScheduledPosts ? 'Ready to publish' : 'No scheduled posts'}
          </p>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isProUser ? 'Team Members' : 'Total Reach'}
          </CardTitle>
          {isProUser ? (
            <Users className="h-4 w-4 text-purple-600" />
          ) : (
            <Target className={`h-4 w-4 ${isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isProUser ? (teamMembersCount || '--') : totalFollowers ? totalFollowers.toLocaleString() : '--'}
          </div>
          <p className="text-xs text-muted-foreground">
            {isProUser ? (teamMembersCount ? 'Active collaborators' : 'No team members') : totalFollowers ? 'Total followers' : 'No followers data'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
