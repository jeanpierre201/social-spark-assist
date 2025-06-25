
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Target, 
  Crown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';

interface SocialMetric {
  platform: string;
  followers_count: number;
  engagement_rate: number;
  posts_count: number;
  scheduled_posts_count: number;
}

interface ProAnalyticsProps {
  metrics?: SocialMetric[];
}

const ProAnalytics = ({ metrics = [] }: ProAnalyticsProps) => {
  // Mock data for demonstration (in real app, this would come from API)
  const engagementData = [
    { month: 'Jan', engagement: 2.4, reach: 12000, impressions: 45000 },
    { month: 'Feb', engagement: 3.1, reach: 15000, impressions: 52000 },
    { month: 'Mar', engagement: 2.8, reach: 13500, impressions: 48000 },
    { month: 'Apr', engagement: 3.5, reach: 18000, impressions: 65000 },
    { month: 'May', engagement: 4.2, reach: 22000, impressions: 78000 },
    { month: 'Jun', engagement: 3.9, reach: 20000, impressions: 72000 },
  ];

  const platformData = metrics.length > 0 ? metrics.map(metric => ({
    platform: metric.platform,
    followers: metric.followers_count,
    engagement: metric.engagement_rate,
    posts: metric.posts_count,
  })) : [
    { platform: 'Instagram', followers: 15000, engagement: 3.2, posts: 45 },
    { platform: 'LinkedIn', followers: 8500, engagement: 4.1, posts: 32 },
    { platform: 'Twitter', followers: 12000, engagement: 2.8, posts: 67 },
  ];

  const contentPerformance = [
    { type: 'Video', count: 45, avgEngagement: 4.2 },
    { type: 'Image', count: 120, avgEngagement: 3.1 },
    { type: 'Carousel', count: 35, avgEngagement: 3.8 },
    { type: 'Story', count: 80, avgEngagement: 2.9 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  const chartConfig = {
    engagement: {
      label: "Engagement Rate",
      color: "#8b5cf6",
    },
    reach: {
      label: "Reach",
      color: "#06b6d4",
    },
    impressions: {
      label: "Impressions",
      color: "#10b981",
    },
  };

  return (
    <div className="space-y-6">
      {/* Pro Analytics Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Crown className="h-5 w-5 mr-2 text-purple-600" />
            Advanced Analytics
            <Badge className="ml-2 bg-purple-100 text-purple-800">Pro</Badge>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Deep insights into your social media performance across all platforms
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="h-5 w-5 mr-2 text-purple-600" />
              Engagement Trends
            </CardTitle>
            <CardDescription>Monthly engagement rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Platform Performance
            </CardTitle>
            <CardDescription>Followers and engagement by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="followers" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Content Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
              Content Type Distribution
            </CardTitle>
            <CardDescription>Performance by content type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {contentPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Advanced Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Advanced Metrics
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span className="font-medium">Average Engagement Rate</span>
              <span className="text-purple-600 font-bold">3.4%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="font-medium">Total Reach (30 days)</span>
              <span className="text-blue-600 font-bold">142K</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="font-medium">Conversion Rate</span>
              <span className="text-green-600 font-bold">2.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="font-medium">Best Posting Time</span>
              <span className="text-yellow-600 font-bold">2-4 PM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Recommendations to improve your social media performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-medium text-purple-900">📈 Engagement Opportunity</h4>
              <p className="text-sm text-gray-600">Your video content performs 35% better than images. Consider increasing video production.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-medium text-blue-900">⏰ Optimal Timing</h4>
              <p className="text-sm text-gray-600">Posts published between 2-4 PM receive 40% more engagement on average.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-medium text-green-900">🎯 Audience Growth</h4>
              <p className="text-sm text-gray-600">Your follower growth rate is 15% above industry average. Maintain consistency!</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-medium text-yellow-900">💡 Content Strategy</h4>
              <p className="text-sm text-gray-600">Carousel posts show high engagement. Try creating more educational carousel content.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProAnalytics;
