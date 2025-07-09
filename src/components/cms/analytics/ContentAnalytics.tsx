
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { FileText, Zap, Target, DollarSign } from 'lucide-react';

interface ContentData {
  date_recorded: string;
  total_posts_generated: number;
  posts_by_tier: Record<string, number>;
  success_rate: number;
  popular_industries: string[];
  api_calls_count: number;
  api_cost: number;
}

interface ContentAnalyticsProps {
  data: ContentData[];
  loading: boolean;
}

const ContentAnalytics = ({ data, loading }: ContentAnalyticsProps) => {
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

  // Calculate metrics
  const totalPosts = data.reduce((sum, item) => sum + item.total_posts_generated, 0);
  const totalApiCalls = data.reduce((sum, item) => sum + item.api_calls_count, 0);
  const totalApiCost = data.reduce((sum, item) => sum + item.api_cost, 0);
  const avgSuccessRate = data.length > 0 ? data.reduce((sum, item) => sum + item.success_rate, 0) / data.length : 0;

  // Process tier data
  const tierData = data.reduce((acc: any, item) => {
    Object.entries(item.posts_by_tier || {}).forEach(([tier, count]) => {
      if (!acc[tier]) acc[tier] = 0;
      acc[tier] += count;
    });
    return acc;
  }, {});

  const tierChartData = Object.entries(tierData).map(([tier, count]) => ({
    tier,
    count: count as number
  }));

  // Process industry data
  const industryData = data.reduce((acc: any, item) => {
    (item.popular_industries || []).forEach(industry => {
      if (!acc[industry]) acc[industry] = 0;
      acc[industry] += 1;
    });
    return acc;
  }, {});

  const industryChartData = Object.entries(industryData)
    .map(([industry, count]) => ({ industry, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B', '#6B7280', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts Generated</p>
                <p className="text-2xl font-bold text-blue-600">{totalPosts.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-purple-600">{totalApiCalls.toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Cost</p>
                <p className="text-2xl font-bold text-orange-600">${totalApiCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Generation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Content Generation Trend</CardTitle>
            <CardDescription>Daily posts generated</CardDescription>
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
                  dataKey="total_posts_generated" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Posts by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Posts by Subscription Tier</CardTitle>
            <CardDescription>Content generation distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, count }) => `${tier}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {tierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
            <CardDescription>Content generation success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="success_rate" 
                  stroke="#10B981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Industries</CardTitle>
            <CardDescription>Most requested content industries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="industry" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>Daily API calls and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis yAxisId="calls" />
                <YAxis yAxisId="cost" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="calls"
                  type="monotone" 
                  dataKey="api_calls_count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="API Calls"
                />
                <Line 
                  yAxisId="cost"
                  type="monotone" 
                  dataKey="api_cost" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="API Cost ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentAnalytics;
