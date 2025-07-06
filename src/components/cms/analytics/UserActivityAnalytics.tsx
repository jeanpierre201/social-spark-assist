
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, UserPlus, RotateCcw, Activity } from 'lucide-react';

interface UserActivityData {
  date_recorded: string;
  total_active_users: number;
  new_users: number;
  returning_users: number;
  total_sessions: number;
  page_views: number;
}

interface UserActivityAnalyticsProps {
  data: UserActivityData[];
  loading: boolean;
}

const UserActivityAnalytics = ({ data, loading }: UserActivityAnalyticsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const chartData = [...data].reverse();

  // Calculate metrics
  const totalActiveUsers = data.reduce((sum, item) => sum + item.total_active_users, 0);
  const totalNewUsers = data.reduce((sum, item) => sum + item.new_users, 0);
  const totalReturningUsers = data.reduce((sum, item) => sum + item.returning_users, 0);
  const totalPageViews = data.reduce((sum, item) => sum + item.page_views, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalActiveUsers.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-green-600">{totalNewUsers.toLocaleString()}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Returning Users</p>
                <p className="text-2xl font-bold text-purple-600">{totalReturningUsers.toLocaleString()}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-orange-600">{totalPageViews.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
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
