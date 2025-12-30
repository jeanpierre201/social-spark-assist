import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Crown, Zap, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SubscriptionData {
  date_recorded: string;
  subscription_tier: string;
  new_subscriptions: number;
  active_subscriptions: number;
  revenue_generated: number;
  upgrade_count: number;
  downgrade_count: number;
}

interface CurrentTierCounts {
  Free: number;
  Starter: number;
  Pro: number;
}

interface SubscriptionAnalyticsProps {
  data: SubscriptionData[];
  loading: boolean;
  currentTierCounts?: CurrentTierCounts;
}

const SubscriptionAnalytics = ({ data, loading, currentTierCounts }: SubscriptionAnalyticsProps) => {
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

  // Process data for charts - aggregate by date, adding current tier counts for the most recent day
  const chartData = data.reduce((acc: any[], item) => {
    const existingEntry = acc.find(entry => entry.date === item.date_recorded);
    if (existingEntry) {
      existingEntry[`${item.subscription_tier}_active`] = Math.max(0, item.active_subscriptions);
      existingEntry[`${item.subscription_tier}_new`] = item.new_subscriptions;
      existingEntry[`${item.subscription_tier}_revenue`] = item.revenue_generated;
    } else {
      acc.push({
        date: item.date_recorded,
        [`${item.subscription_tier}_active`]: Math.max(0, item.active_subscriptions),
        [`${item.subscription_tier}_new`]: item.new_subscriptions,
        [`${item.subscription_tier}_revenue`]: item.revenue_generated,
        Free_active: item.subscription_tier === 'Free' ? Math.max(0, item.active_subscriptions) : 0,
        Starter_active: item.subscription_tier === 'Starter' ? Math.max(0, item.active_subscriptions) : 0,
        Pro_active: item.subscription_tier === 'Pro' ? Math.max(0, item.active_subscriptions) : 0,
      });
    }
    return acc;
  }, []).reverse();

  // If we have current tier counts, update the most recent data point or add a new one for today
  if (currentTierCounts && chartData.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const lastEntry = chartData[chartData.length - 1];
    
    if (lastEntry.date === today) {
      // Update today's data with current counts
      lastEntry.Free_active = currentTierCounts.Free;
      lastEntry.Starter_active = currentTierCounts.Starter;
      lastEntry.Pro_active = currentTierCounts.Pro;
    } else {
      // Add today's data point with current counts
      chartData.push({
        date: today,
        Free_active: currentTierCounts.Free,
        Starter_active: currentTierCounts.Starter,
        Pro_active: currentTierCounts.Pro,
        Free_new: 0,
        Starter_new: 0,
        Pro_new: 0,
        Free_revenue: 0,
        Starter_revenue: 0,
        Pro_revenue: 0,
      });
    }
  } else if (currentTierCounts && chartData.length === 0) {
    // No historical data, create a single data point with current counts
    const today = new Date().toISOString().split('T')[0];
    chartData.push({
      date: today,
      Free_active: currentTierCounts.Free,
      Starter_active: currentTierCounts.Starter,
      Pro_active: currentTierCounts.Pro,
      Free_new: 0,
      Starter_new: 0,
      Pro_new: 0,
    });
  }

  // Use real current tier counts if provided
  const tierData = currentTierCounts 
    ? [
        { tier: 'Free', active: currentTierCounts.Free, fill: '#10B981' },
        { tier: 'Starter', active: currentTierCounts.Starter, fill: '#3B82F6' },
        { tier: 'Pro', active: currentTierCounts.Pro, fill: '#8B5CF6' },
      ].filter(t => t.active > 0)
    : data.reduce((acc: any[], item) => {
        const existing = acc.find(entry => entry.tier === item.subscription_tier);
        if (existing) {
          existing.active = Math.max(0, item.active_subscriptions);
        } else {
          acc.push({
            tier: item.subscription_tier,
            active: Math.max(0, item.active_subscriptions),
            fill: item.subscription_tier === 'Pro' ? '#8B5CF6' : 
                  item.subscription_tier === 'Starter' ? '#3B82F6' : '#10B981',
          });
        }
        return acc;
      }, []);

  const COLORS = {
    Pro: '#8B5CF6',
    Starter: '#3B82F6', 
    Free: '#10B981'
  };

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
                <p className="text-xs text-gray-500 mt-1">Users who upgraded their plan</p>
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
                <p className="text-xs text-gray-500 mt-1">Users who downgraded their plan</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">Net Growth</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Net Growth = Total Upgrades - Total Downgrades</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Positive means more users upgraded than downgraded.
                          Negative means more users downgraded than upgraded.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-2xl font-bold ${netUpgrades >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netUpgrades >= 0 ? '+' : ''}{netUpgrades}
                </p>
                <p className="text-xs text-gray-500 mt-1">Upgrades minus downgrades</p>
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
            <CardDescription>Daily active subscriptions by tier (includes Free users)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Pro_active" stroke="#8B5CF6" strokeWidth={2} name="Pro" />
                <Line type="monotone" dataKey="Starter_active" stroke="#3B82F6" strokeWidth={2} name="Starter" />
                <Line type="monotone" dataKey="Free_active" stroke="#10B981" strokeWidth={2} name="Free" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Tier Distribution - REAL TIME from subscribers table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription Distribution</CardTitle>
            <CardDescription>
              Real-time count of users by tier
              {currentTierCounts && (
                <span className="block mt-1 text-xs">
                  Free: {currentTierCounts.Free} | Starter: {currentTierCounts.Starter} | Pro: {currentTierCounts.Pro}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ tier, active }) => `${tier}: ${active}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="active"
                    nameKey="tier"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[entry.tier as keyof typeof COLORS] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, `${name} users`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No subscription data available
              </div>
            )}
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
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pro_new" fill="#8B5CF6" name="Pro" />
                <Bar dataKey="Starter_new" fill="#3B82F6" name="Starter" />
                <Bar dataKey="Free_new" fill="#10B981" name="Free" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Daily revenue generated by subscription tier (€)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="Pro_revenue" fill="#8B5CF6" name="Pro" />
                <Bar dataKey="Starter_revenue" fill="#3B82F6" name="Starter" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
