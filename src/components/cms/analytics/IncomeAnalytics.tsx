
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Percent, Users, Crown, Zap, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStripeRevenue, StripeRevenueData } from '@/hooks/useStripeRevenue';
import { DateRange } from '@/hooks/useAnalytics';

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
  dateRange?: DateRange;
}

const STARTER_PRICE = 12;
const PRO_PRICE = 25;

const IncomeAnalytics = ({ data, loading, revenueStats, dateRange }: IncomeAnalyticsProps) => {
  const { stripeData, loading: stripeLoading, error: stripeError, refetch: fetchStripeRevenue } = useStripeRevenue({
    dateRange,
    enabled: true
  });

  // Fetch Stripe data on mount and when date range changes
  useEffect(() => {
    fetchStripeRevenue();
  }, [fetchStripeRevenue]);

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

  // Use Stripe data if available, otherwise fall back to calculated estimates
  const hasStripeData = stripeData && !stripeError;
  
  const mrr = hasStripeData ? stripeData.mrr : (revenueStats?.mrr || 0);
  const totalRevenue = hasStripeData ? stripeData.totalRevenue : (revenueStats?.mrr || 0);
  const paidSubscribers = hasStripeData ? stripeData.activeSubscriptions : (revenueStats?.paid_subscribers || 0);
  const avgRevenuePerSubscriber = hasStripeData 
    ? stripeData.avgRevenuePerSubscriber 
    : (paidSubscribers > 0 ? mrr / paidSubscribers : 0);
  const annualRunRate = hasStripeData ? stripeData.annualRunRate : (mrr * 12);
  const totalTransactions = hasStripeData ? stripeData.totalTransactions : 0;

  // Revenue breakdown for chart
  const revenueBreakdown = hasStripeData 
    ? [
        { 
          tier: 'Starter', 
          subscribers: stripeData.subscriberCounts.starter, 
          revenue: stripeData.subscriberCounts.starter * STARTER_PRICE,
        },
        { 
          tier: 'Pro', 
          subscribers: stripeData.subscriberCounts.pro, 
          revenue: stripeData.subscriberCounts.pro * PRO_PRICE,
        },
      ]
    : revenueStats 
      ? [
          { tier: 'Starter', subscribers: revenueStats.tier_counts.Starter, revenue: revenueStats.tier_counts.Starter * STARTER_PRICE },
          { tier: 'Pro', subscribers: revenueStats.tier_counts.Pro, revenue: revenueStats.tier_counts.Pro * PRO_PRICE },
        ]
      : [];

  // Daily revenue chart data
  const dailyRevenueData = hasStripeData && stripeData.dailyRevenue.length > 0
    ? stripeData.dailyRevenue
    : [];

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasStripeData ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Live Stripe Data</span>
            </div>
          ) : stripeLoading ? (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading Stripe data...</span>
            </div>
          ) : stripeError ? (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Using estimated data (Stripe unavailable)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Estimated Revenue</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchStripeRevenue()}
          disabled={stripeLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${stripeLoading ? 'animate-spin' : ''}`} />
          Refresh Stripe Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {hasStripeData ? 'Total Revenue' : 'Monthly Recurring Revenue'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  €{totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {hasStripeData ? 'From Stripe payments' : 'Based on active subscriptions'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MRR</p>
                <p className="text-2xl font-bold text-blue-600">
                  €{mrr.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Subscribers</p>
                <p className="text-2xl font-bold text-purple-600">{paidSubscribers}</p>
                <p className="text-xs text-gray-500 mt-1">Active subscriptions</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annual Run Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{annualRunRate.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Projected yearly</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stripe Stats */}
      {hasStripeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                  <p className="text-xs text-gray-500 mt-1">In selected period</p>
                </div>
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{stripeData.availableBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Ready for payout</p>
                </div>
                <Wallet className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Balance</p>
                  <p className="text-2xl font-bold text-amber-600">
                    €{stripeData.pendingBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Being processed</p>
                </div>
                <Wallet className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                <p className="text-sm mt-1">Revenue will appear when users subscribe</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              {hasStripeData ? 'Daily payments from Stripe' : 'No payment data available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <TrendingUp className="h-12 w-12 mb-4 text-gray-300" />
                <p>No payment history</p>
                <p className="text-sm mt-1">Payments will appear here once processed</p>
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
                    €{(hasStripeData ? stripeData.subscriberCounts.starter : revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{hasStripeData ? stripeData.subscriberCounts.starter : revenueStats?.tier_counts.Starter || 0} subscribers</span>
                  <span>•</span>
                  <span>
                    {mrr > 0 
                      ? Math.round(((hasStripeData ? stripeData.subscriberCounts.starter : revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE / mrr) * 100) 
                      : 0}% of MRR
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${mrr > 0 
                        ? Math.round(((hasStripeData ? stripeData.subscriberCounts.starter : revenueStats?.tier_counts.Starter || 0) * STARTER_PRICE / mrr) * 100) 
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
                    €{(hasStripeData ? stripeData.subscriberCounts.pro : revenueStats?.tier_counts.Pro || 0) * PRO_PRICE}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{hasStripeData ? stripeData.subscriberCounts.pro : revenueStats?.tier_counts.Pro || 0} subscribers</span>
                  <span>•</span>
                  <span>
                    {mrr > 0 
                      ? Math.round(((hasStripeData ? stripeData.subscriberCounts.pro : revenueStats?.tier_counts.Pro || 0) * PRO_PRICE / mrr) * 100) 
                      : 0}% of MRR
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${mrr > 0 
                        ? Math.round(((hasStripeData ? stripeData.subscriberCounts.pro : revenueStats?.tier_counts.Pro || 0) * PRO_PRICE / mrr) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total MRR</span>
                  <span className="text-xl font-bold text-green-600">€{mrr.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {hasStripeData && stripeData.recentPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest successful transactions from Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {stripeData.recentPayments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          €{payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.created).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {payment.id.slice(-8)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Reference */}
        <Card className={hasStripeData && stripeData.recentPayments.length > 0 ? '' : 'lg:col-span-2'}>
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
                <p className="text-sm font-medium mt-2">
                  {hasStripeData ? stripeData.subscriberCounts.starter : revenueStats?.tier_counts.Starter || 0} subscribers
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Pro</span>
                </div>
                <p className="text-2xl font-bold">€{PRO_PRICE}<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-gray-500">All features</p>
                <p className="text-sm font-medium mt-2">
                  {hasStripeData ? stripeData.subscriberCounts.pro : revenueStats?.tier_counts.Pro || 0} subscribers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeAnalytics;
