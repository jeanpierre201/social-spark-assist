
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

interface AnalyticsData {
  platform: string;
  metric_type: string;
  metric_value: number;
  date_recorded: string;
}

interface CompetitorData {
  competitor_name: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
}

interface ContentInsights {
  content_type: string;
  platform: string;
  total_posts: number;
  avg_engagement_rate: number;
}

const ProAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([]);
  const [contentInsights, setContentInsights] = useState<ContentInsights[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data
      const { data: analytics } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch competitor analysis
      const { data: competitors } = await supabase
        .from('competitor_analysis')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch content insights
      const { data: insights } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', user?.id);

      setAnalyticsData(analytics || []);
      setCompetitorData(competitors || []);
      setContentInsights(insights || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const engagementData = analyticsData
    .filter(item => item.metric_type === 'engagement')
    .reduce((acc: any[], curr) => {
      const month = new Date(curr.date_recorded).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.engagement = (existing.engagement + curr.metric_value) / 2;
      } else {
        acc.push({ month, engagement: curr.metric_value });
      }
      return acc;
    }, []);

  const platformData = analyticsData
    .reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.platform === curr.platform);
      if (existing) {
        existing.totalValue += curr.metric_value;
      } else {
        acc.push({ platform: curr.platform, totalValue: curr.metric_value });
      }
      return acc;
    }, []);

  const contentPerformance = contentInsights.map(insight => ({
    type: insight.content_type,
    count: insight.total_posts,
    avgEngagement: insight.avg_engagement_rate,
  }));

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <Crown className="h-5 w-5 mr-2 text-purple-600" />
              Advanced Analytics
              <Badge className="ml-2 bg-purple-100 text-purple-800">Pro</Badge>
            </CardTitle>
            <CardDescription className="text-purple-700">
              Loading analytics data...
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const hasAnalyticsData = analyticsData.length > 0;
  const hasCompetitorData = competitorData.length > 0;
  const hasContentData = contentInsights.length > 0;

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
            {hasAnalyticsData 
              ? 'Deep insights into your social media performance across all platforms'
              : 'No analytics data available yet. Connect your accounts and generate content to see insights here.'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Show charts only if we have data */}
      {hasAnalyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Trends */}
          {engagementData.length > 0 && (
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
          )}

          {/* Platform Performance */}
          {platformData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Platform Performance
                </CardTitle>
                <CardDescription>Performance metrics by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalValue" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Content Type Performance */}
          {hasContentData && contentPerformance.length > 0 && (
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
          )}

          {/* Advanced Metrics */}
          {hasAnalyticsData && (
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
                  <span className="font-medium">Total Data Points</span>
                  <span className="text-purple-600 font-bold">{analyticsData.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-medium">Platforms Tracked</span>
                  <span className="text-blue-600 font-bold">{platformData.length}</span>
                </div>
                {hasContentData && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">Content Types</span>
                    <span className="text-green-600 font-bold">{contentInsights.length}</span>
                  </div>
                )}
                {hasCompetitorData && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span className="font-medium">Competitors Analyzed</span>
                    <span className="text-yellow-600 font-bold">{competitorData.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance Insights - only show if we have competitor data */}
      {hasCompetitorData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              Competitor Insights
            </CardTitle>
            <CardDescription>Analysis based on your competitor research</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitorData.slice(0, 4).map((competitor, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-medium text-purple-900">📊 {competitor.competitor_name}</h4>
                  <p className="text-sm text-gray-600">
                    {competitor.followers_count.toLocaleString()} followers on {competitor.platform} 
                    with {competitor.engagement_rate}% engagement rate
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {!hasAnalyticsData && !hasCompetitorData && !hasContentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              No Analytics Data Available
            </CardTitle>
            <CardDescription>
              Start generating content and connecting your social accounts to see advanced analytics here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Your advanced analytics will appear here once you have:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Connected your social media accounts</li>
              <li>• Generated and published content</li>
              <li>• Added competitor analysis data</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProAnalytics;
