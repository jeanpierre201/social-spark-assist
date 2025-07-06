
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Crown, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface SubscriptionData {
  date_recorded: string;
  subscription_tier: string;
  new_subscriptions: number;
  active_subscriptions: number;
  revenue_generated: number;
  upgrade_count: number;
  downgrade_count: number;
}

interface SubscriptionAnalyticsProps {
  data: SubscriptionData[];
  loading: boolean;
}

const SubscriptionAnalytics = ({ data, loading }: SubscriptionAnalyticsProps) => {
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

  // Process data for charts
  const chartData = data.reduce((acc: any[], item) => {
    const existingEntry = acc.find(entry => entry.date === item.date_recorded);
    if (existingEntry) {
      existingEntry[`${item.subscription_tier}_active`] = item.active_subscriptions;
      existingEntry[`${item.subscription_tier}_new`] = item.new_subscriptions;
      existingEntry[`${item.subscription_tier}_revenue`] = item.revenue_generated;
    } else {
      acc.push({
        date: item.date_recorded,
        [`${item.subscription_tier}_active`]: item.active_subscriptions,
        [`${item.subscription_tier}_new`]: item.new_subscriptions,
        [`${item.subscription_tier}_revenue`]: item.revenue_generated,
      });
    }
    return acc;
  }, []).reverse();

  // Tier distribution data
  const tierData = data.reduce((acc: any[], item) => {
    const existing = acc.find(entry => entry.tier === item.subscription_tier);
    if (existing) {
      existing.active += item.active_subscriptions;
    } else {
      acc.push({
        tier: item.subscription_tier,
        active: item.active_subscriptions,
      });
    }
    return acc;
  }, []);

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  // Calculate metrics
  const totalUpgrades = data.reduce((sum, item) => sum + item.upgrade_count, 0);
  const totalDowngrades = data.reduce((sum, item) => sum + item.downgrade_count, 0);
  const netUpgrades = totalUpgrades - totalDowngrades;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Upgrades</p>
                <p className="text-2xl font-bold text-purple-600">{totalUpgrades}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downgrades</p>
                <p className="text-2xl font-bold text-red-600">{totalDowngrades}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Growth</p>
                <p className={`text-2xl font-bold ${netUpgrades >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netUpgrades >= 0 ? '+' : ''}{netUpgrades}
                </p>
              </div>
              {netUpgrades >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscriptions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions Trend</CardTitle>
            <CardDescription>Daily active subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Pro_active" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="Starter_active" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Current active subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, active }) => `${tier}: ${active}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="active"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>New Subscriptions</CardTitle>
            <CardDescription>Daily new subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Pro_new" fill="#8B5CF6" />
                <Bar dataKey="Starter_new" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Daily revenue generated by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="Pro_revenue" fill="#8B5CF6" />
                <Bar dataKey="Starter_revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
