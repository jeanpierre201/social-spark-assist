
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Zap, Target, DollarSign, Send, Calendar, Image, MessageSquare, TrendingUp } from 'lucide-react';

interface ContentData {
  date_recorded: string;
  total_posts_generated: number;
  posts_by_tier: Record<string, number>;
  success_rate: number;
  popular_industries: string[];
  api_calls_count: number;
  api_cost: number;
}

interface ContentStats {
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  content_costs: {
    total_text_generations: number;
    total_image_generations: number;
    estimated_text_cost: number;
    estimated_image_cost: number;
    total_cost: number;
  };
  posts_by_tier: {
    Free: number;
    Starter: number;
    Pro: number;
  };
  industries: { name: string; count: number }[];
}

interface ContentAnalyticsProps {
  data: ContentData[];
  loading: boolean;
  contentStats?: ContentStats;
}

const ContentAnalytics = ({ data, loading, contentStats }: ContentAnalyticsProps) => {
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

  // Use synced contentStats for real-time counts
  const totalPosts = contentStats?.total_posts ?? data.reduce((sum, item) => sum + item.total_posts_generated, 0);
  const publishedPosts = contentStats?.published_posts ?? 0;
  const scheduledPosts = contentStats?.scheduled_posts ?? 0;
  const draftPosts = contentStats?.draft_posts ?? 0;
  
  // Cost data from synced stats
  const textGenerations = contentStats?.content_costs?.total_text_generations ?? 0;
  const imageGenerations = contentStats?.content_costs?.total_image_generations ?? 0;
  const textCost = contentStats?.content_costs?.estimated_text_cost ?? 0;
  const imageCost = contentStats?.content_costs?.estimated_image_cost ?? 0;
  const totalCost = contentStats?.content_costs?.total_cost ?? data.reduce((sum, item) => sum + item.api_cost, 0);
  
  // Posts by tier from synced stats
  const tierChartData = contentStats?.posts_by_tier 
    ? [
        { tier: 'Free', count: contentStats.posts_by_tier.Free },
        { tier: 'Starter', count: contentStats.posts_by_tier.Starter },
        { tier: 'Pro', count: contentStats.posts_by_tier.Pro }
      ].filter(t => t.count > 0)
    : Object.entries(data.reduce((acc: any, item) => {
        Object.entries(item.posts_by_tier || {}).forEach(([tier, count]) => {
          if (!acc[tier]) acc[tier] = 0;
          acc[tier] += count;
        });
        return acc;
      }, {})).map(([tier, count]) => ({ tier, count: count as number }));

  // Industry data from synced stats
  const industryChartData = contentStats?.industries?.slice(0, 8) ?? 
    Object.entries(data.reduce((acc: any, item) => {
      (item.popular_industries || []).forEach(industry => {
        if (!acc[industry]) acc[industry] = 0;
        acc[industry] += 1;
      });
      return acc;
    }, {}))
      .map(([industry, count]) => ({ name: industry, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

  const avgSuccessRate = data.length > 0 ? data.reduce((sum, item) => sum + item.success_rate, 0) / data.length : 100;

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B', '#6B7280', '#EC4899'];

  // Cost breakdown for pie chart
  const costBreakdown = [
    { name: 'Text Generation', value: textCost, color: '#3B82F6' },
    { name: 'Image Generation', value: imageCost, color: '#8B5CF6' }
  ].filter(c => c.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards - Synced with contentStats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Posts</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalPosts.toLocaleString()}</p>
              </div>
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Published</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{publishedPosts.toLocaleString()}</p>
              </div>
              <Send className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{scheduledPosts.toLocaleString()}</p>
              </div>
              <Calendar className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Drafts</p>
                <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{draftPosts.toLocaleString()}</p>
              </div>
              <FileText className="h-6 w-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Text Gens</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{textGenerations.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Image Gens</p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{imageGenerations.toLocaleString()}</p>
              </div>
              <Image className="h-6 w-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{avgSuccessRate.toFixed(0)}%</p>
              </div>
              <Target className="h-6 w-6 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Cost Breakdown Section */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Content Creation Costs
          </CardTitle>
          <CardDescription>Estimated API costs based on usage (GPT-4o-mini: $0.002/text, DALL-E 3: $0.04/image)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cost Summary Cards */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Text Generation</span>
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${textCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{textGenerations} generations</p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Image Generation</span>
                  <Image className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${imageCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{imageGenerations} images</p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total API Cost</span>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
            </div>

            {/* Cost Breakdown Pie Chart */}
            <div className="md:col-span-2">
              {costBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No cost data available yet
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Generation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Content Generation Trend</CardTitle>
            <CardDescription>Daily posts generated</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
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
                    name="Posts"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No trend data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Posts by Subscription Tier</CardTitle>
            <CardDescription>Content generation distribution (synced)</CardDescription>
          </CardHeader>
          <CardContent>
            {tierChartData.length > 0 ? (
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No tier data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
            <CardDescription>Content generation success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
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
                    name="Success Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Industries</CardTitle>
            <CardDescription>Most requested content industries (synced)</CardDescription>
          </CardHeader>
          <CardContent>
            {industryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" name="Posts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No industry data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Usage Trend (from historical data) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>API Usage Over Time</CardTitle>
            <CardDescription>Daily API calls and costs trend</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_recorded" />
                  <YAxis yAxisId="calls" />
                  <YAxis yAxisId="cost" orientation="right" />
                  <Tooltip />
                  <Legend />
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No API usage data available for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentAnalytics;
