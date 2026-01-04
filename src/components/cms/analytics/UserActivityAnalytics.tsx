
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, UserPlus, RotateCcw, Activity, Crown, Zap } from 'lucide-react';

interface UserActivityData {
  date_recorded: string;
  total_active_users: number;
  new_users: number;
  returning_users: number;
  total_sessions: number;
  page_views: number;
}

interface TierCounts {
  Free: number;
  Starter: number;
  Pro: number;
}

interface CurrentStats {
  active_users: number;
  total_active_subscribers: number;
  tier_counts: TierCounts;
  promo_subscribers: number;
  paid_subscribers: number;
}

interface UserActivityAnalyticsProps {
  data: UserActivityData[];
  loading: boolean;
  currentStats?: CurrentStats;
}

const UserActivityAnalytics = ({ data, loading, currentStats }: UserActivityAnalyticsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const chartData = [...data].reverse();

  // Use synced currentStats for real-time counts, fallback to historical data
  const totalActiveUsers = currentStats?.active_users ?? data.reduce((sum, item) => sum + item.total_active_users, 0);
  const totalRegisteredUsers = currentStats?.total_active_subscribers ?? 0;
  const totalNewUsers = data.reduce((sum, item) => sum + item.new_users, 0);
  const totalReturningUsers = data.reduce((sum, item) => sum + item.returning_users, 0);
  const totalPageViews = data.reduce((sum, item) => sum + item.page_views, 0);
  
  // Synced tier breakdown
  const tierCounts = currentStats?.tier_counts ?? { Free: 0, Starter: 0, Pro: 0 };
  const promoSubscribers = currentStats?.promo_subscribers ?? 0;
  const paidSubscribers = currentStats?.paid_subscribers ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards - Synced with currentStats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalActiveUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Created posts in period</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registered</p>
                <p className="text-2xl font-bold text-green-600">{totalRegisteredUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All users in database</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Subscribers</p>
                <p className="text-2xl font-bold text-purple-600">{paidSubscribers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Stripe billing active</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promo Subscribers</p>
                <p className="text-2xl font-bold text-orange-600">{promoSubscribers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Via promo codes</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Free Tier</p>
                <p className="text-2xl font-bold text-emerald-600">{tierCounts.Free.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Starter Tier</p>
                <p className="text-2xl font-bold text-blue-600">{tierCounts.Starter.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pro Tier</p>
                <p className="text-2xl font-bold text-purple-600">{tierCounts.Pro.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users Trend</CardTitle>
            <CardDescription>Daily active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="total_active_users" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New vs Returning Users */}
        <Card>
          <CardHeader>
            <CardTitle>User Acquisition</CardTitle>
            <CardDescription>New users vs returning users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="new_users" fill="#10B981" name="New Users" />
                <Bar dataKey="returning_users" fill="#8B5CF6" name="Returning Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Session Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
            <CardDescription>Daily session count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="total_sessions" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card>
          <CardHeader>
            <CardTitle>Page Views</CardTitle>
            <CardDescription>Daily page view count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="page_views" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserActivityAnalytics;
