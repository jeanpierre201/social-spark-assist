
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Percent, Users, Crown, Zap } from 'lucide-react';

interface IncomeData {
  date_recorded: string;
  total_revenue: number;
  subscription_revenue: number;
  net_revenue: number;
  transaction_count: number;
  monthly_recurring_revenue: number;
}

interface RevenueStats {
  mrr: number;
  estimated_revenue: number;
  paid_subscribers: number;
  tier_counts: {
    Free: number;
    Starter: number;
    Pro: number;
  };
}

interface IncomeAnalyticsProps {
  data: IncomeData[];
  loading: boolean;
  revenueStats?: RevenueStats;
}

const STARTER_PRICE = 12;
const PRO_PRICE = 25;

const IncomeAnalytics = ({ data, loading, revenueStats }: IncomeAnalyticsProps) => {
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

  // Use real revenue stats if available, otherwise fall back to income_analytics data
  const hasRealStats = revenueStats && (revenueStats.mrr > 0 || revenueStats.paid_subscribers > 0);
  
  // Calculate metrics from income_analytics table
  const tableRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.transaction_count, 0);
  const latestTableMRR = data.length > 0 ? data[0].monthly_recurring_revenue : 0;

  // Use real calculated values
  const mrr = hasRealStats ? revenueStats.mrr : latestTableMRR;
  const totalRevenue = hasRealStats ? revenueStats.mrr : tableRevenue;
  const paidSubscribers = revenueStats?.paid_subscribers || 0;
  const avgRevenuePerSubscriber = paidSubscribers > 0 ? mrr / paidSubscribers : 0;

  // Create revenue breakdown data for chart
  const revenueBreakdown = revenueStats ? [
    { 
      tier: 'Starter', 
      subscribers: revenueStats.tier_counts.Starter, 
      revenue: revenueStats.tier_counts.Starter * STARTER_PRICE,
      price: STARTER_PRICE
    },
    { 
      tier: 'Pro', 
      subscribers: revenueStats.tier_counts.Pro, 
      revenue: revenueStats.tier_counts.Pro * PRO_PRICE,
      price: PRO_PRICE
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  €{mrr.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Based on active subscriptions</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Subscribers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {paidSubscribers}
                </p>
                <p className="text-xs text-gray-500 mt-1">Starter + Pro users</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Subscriber</p>
                <p className="text-2xl font-bold text-purple-600">
                  €{avgRevenuePerSubscriber.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per paid subscriber</p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annual Run Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{(mrr * 12).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Projected yearly revenue</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Subscription Tier</CardTitle>
            <CardDescription>Monthly revenue breakdown by plan</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueBreakdown.length > 0 && revenueBreakdown.some(r => r.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`€${value}`, 'Revenue'];
                      if (name === 'subscribers') return [value, 'Subscribers'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="Revenue (€)" />
                  <Bar dataKey="subscribers" fill="#3B82F6" name="Subscribers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <Crown className="h-12 w-12 mb-4 text-gray-300" />
                <p>No paid subscribers yet</p>
                <p className="text-sm mt-1">Revenue will appear when users subscribe to Starter or Pro</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriber Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Value Distribution</CardTitle>
            <CardDescription>Revenue contribution by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Starter Tier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Starter Plan</span>
                    <span className="text-sm text-gray-500">(€{STARTER_PRICE}/mo)</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    €{(revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{revenueStats?.tier_counts.Starter || 0} subscribers</span>
                  <span>•</span>
                  <span>
                    {mrr > 0 
                      ? Math.round(((revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE / mrr) * 100) 
                      : 0}% of MRR
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${mrr > 0 
                        ? Math.round(((revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE / mrr) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Pro Tier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Pro Plan</span>
                    <span className="text-sm text-gray-500">(€{PRO_PRICE}/mo)</span>
                  </div>
                  <span className="font-bold text-purple-600">
                    €{(revenueStats?.tier_counts.Pro || 0) * PRO_PRICE}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{revenueStats?.tier_counts.Pro || 0} subscribers</span>
                  <span>•</span>
                  <span>
                    {mrr > 0 
                      ? Math.round(((revenueStats?.tier_counts.Pro || 0) * PRO_PRICE / mrr) * 100) 
                      : 0}% of MRR
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${mrr > 0 
                        ? Math.round(((revenueStats?.tier_counts.Pro || 0) * PRO_PRICE / mrr) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total MRR</span>
                  <span className="text-xl font-bold text-green-600">€{mrr}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Revenue Trend (if data exists) */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Historical revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_recorded" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                  <Area 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* MRR Growth (if data exists) */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>MRR History</CardTitle>
              <CardDescription>Monthly recurring revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_recorded" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, 'MRR']} />
                  <Line 
                    type="monotone" 
                    dataKey="monthly_recurring_revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pricing Reference */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pricing Structure</CardTitle>
            <CardDescription>Current subscription pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Free</span>
                </div>
                <p className="text-2xl font-bold">€0</p>
                <p className="text-sm text-gray-500">Basic features</p>
                <p className="text-sm font-medium mt-2">{revenueStats?.tier_counts.Free || 0} users</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Starter</span>
                </div>
                <p className="text-2xl font-bold">€{STARTER_PRICE}<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-gray-500">Enhanced features</p>
                <p className="text-sm font-medium mt-2">{revenueStats?.tier_counts.Starter || 0} subscribers</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Pro</span>
                </div>
                <p className="text-2xl font-bold">€{PRO_PRICE}<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-gray-500">All features</p>
                <p className="text-sm font-medium mt-2">{revenueStats?.tier_counts.Pro || 0} subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeAnalytics;
