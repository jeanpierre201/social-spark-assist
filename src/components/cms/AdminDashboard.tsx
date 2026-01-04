
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAnalytics, DateRange } from '@/hooks/useAnalytics';
import { useUserRole } from '@/hooks/useUserRole';
import { useStripeRevenue } from '@/hooks/useStripeRevenue';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Activity,
  Crown,
  Zap,
  BarChart3,
  RefreshCw,
  Gift,
  Send,
  AlertTriangle
} from 'lucide-react';
import SubscriptionAnalytics from './analytics/SubscriptionAnalytics';
import IncomeAnalytics from './analytics/IncomeAnalytics';
import UserActivityAnalytics from './analytics/UserActivityAnalytics';
import ContentAnalytics from './analytics/ContentAnalytics';
import PerformanceMetrics from './analytics/PerformanceMetrics';
import PromoCodesManagement from './analytics/PromoCodesManagement';
import DateRangeFilter from './analytics/DateRangeFilter';

const AdminDashboard = () => {
  const { userRole, loading: roleLoading, isAdmin } = useUserRole();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  // Pass enabled flag based on admin status (avoid fetching if not admin)
  const { 
    subscriptionData, 
    incomeData, 
    userActivityData, 
    contentData, 
    currentStats, 
    initialLoading, 
    refreshing, 
    refetch 
  } = useAnalytics({ dateRange, enabled: !roleLoading && isAdmin() });

  // Fetch real Stripe revenue data for top summary card - hook auto-fetches on mount
  const { 
    stripeData, 
    initialLoading: stripeInitialLoading, 
    refreshing: stripeRefreshing, 
    error: stripeError, 
    refetch: fetchStripeRevenue 
  } = useStripeRevenue({
    dateRange,
    enabled: !roleLoading && isAdmin()
  });
  
  const [syncing, setSyncing] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);

  const handleSyncAnalytics = async () => {
    setSyncing(true);
    try {
      console.log('Starting analytics sync...');
      
      // Get the current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase.functions.invoke('sync-analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Sync error:', error);
        throw error;
      }
      
      console.log('Sync successful:', data);
      toast.success('Analytics synced successfully! Refreshing data...');
      
      // Refetch data instead of reloading the page
      await refetch();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Failed to sync analytics: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncStripeSubscribers = async () => {
    setSyncingStripe(true);
    try {
      console.log('Starting Stripe subscribers sync...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase.functions.invoke('sync-stripe-subscribers', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Stripe sync error:', error);
        throw error;
      }
      
      console.log('Stripe sync successful:', data);
      toast.success(`Stripe sync complete: ${data.updated} updated, ${data.deactivated} deactivated, ${data.newFromStripe} new`);
      
      // Refetch both analytics and Stripe data
      await Promise.all([refetch(), fetchStripeRevenue()]);
    } catch (error) {
      console.error('Stripe sync error:', error);
      toast.error(`Failed to sync with Stripe: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncingStripe(false);
    }
  };

  // Only show full-screen spinner during initial role check
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary stats from most recent data
  const latestIncomeData = incomeData[0];
  const latestUserActivityData = userActivityData[0];
  const latestContentData = contentData[0];
  
  // Get latest subscription data by tier and sum active subscriptions
  const latestSubscriptionData = subscriptionData.reduce((acc, item) => {
    const existing = acc.find(s => s.subscription_tier === item.subscription_tier);
    if (!existing || new Date(item.date_recorded) > new Date(existing.date_recorded)) {
      const index = acc.findIndex(s => s.subscription_tier === item.subscription_tier);
      if (index >= 0) {
        acc[index] = item;
      } else {
        acc.push(item);
      }
    }
    return acc;
  }, [] as typeof subscriptionData);

  // Use real Stripe MRR if available, otherwise fall back to database estimate
  const hasStripeData = stripeData && !stripeError;
  const totalRevenue = hasStripeData ? stripeData.mrr : currentStats.mrr;
  const totalActiveUsers = currentStats.active_users;
  const totalPublishedPosts = currentStats.published_posts;
  // Use Stripe active subscriptions count if available (more accurate for paid subs)
  const totalSubscriptions = hasStripeData ? stripeData.activeSubscriptions : currentStats.paid_subscribers;
  
  // Promo code subscribers (from database, these won't be in Stripe)
  const promoSubscribers = currentStats.promo_subscribers;

  // Data quality check: only show discrepancy if Stripe shows MORE than database (unexpected case)
  // If database shows more, it's likely due to promo code users or test mode subscriptions, which is expected
  const dbPaidSubscribers = currentStats.paid_subscribers;
  const stripePaidSubscribers = stripeData?.activeSubscriptions || 0;
  // Only show warning if Stripe reports more subscribers than database has with stripe_customer_id
  // (database having more is expected due to promo codes/test mode)
  const dataDiscrepancy = hasStripeData && stripePaidSubscribers > dbPaidSubscribers;

  // Show skeleton cards during initial data load (dashboard stays mounted)
  const showSkeletons = initialLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and performance insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-sm text-muted-foreground animate-pulse">
                Refreshing...
              </span>
            )}
            {stripeRefreshing && (
              <span className="text-sm text-muted-foreground animate-pulse">
                Updating Stripe...
              </span>
            )}
            <Button 
              onClick={handleSyncAnalytics} 
              disabled={syncing || refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing || refreshing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Analytics'}
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* Promo Code Subscribers Info */}
        {promoSubscribers > 0 && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
            <Gift className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-purple-800">
                {promoSubscribers} Promo Code Subscriber{promoSubscribers !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                These users have active subscriptions via promo codes and are not counted in Stripe revenue metrics.
              </p>
            </div>
          </div>
        )}

        {/* Data Quality Indicator - Only show for unexpected discrepancy */}
        {dataDiscrepancy && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Data Discrepancy Detected</p>
                <p className="text-sm text-amber-700 mt-1">
                  Stripe reports {stripePaidSubscribers} subscription{stripePaidSubscribers !== 1 ? 's' : ''}, 
                  but only {dbPaidSubscribers} subscriber{dbPaidSubscribers !== 1 ? 's' : ''} found in database with Stripe billing.
                  Some Stripe subscriptions may not be synced to the database.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStripeSubscribers}
              disabled={syncingStripe}
              className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncingStripe ? 'animate-spin' : ''}`} />
              {syncingStripe ? 'Syncing...' : 'Sync with Stripe'}
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {hasStripeData ? 'Monthly Revenue (Stripe)' : 'Monthly Revenue (Est.)'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {showSkeletons && !stripeData ? (
                <div className="space-y-2">
                  <div className="h-8 bg-blue-100 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-blue-100 rounded animate-pulse w-16"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-700">
                    €{totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-blue-600">
                    {hasStripeData ? 'From Stripe subscriptions' : 'Database estimate'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {showSkeletons ? (
                <div className="space-y-2">
                  <div className="h-8 bg-green-100 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-green-100 rounded animate-pulse w-16"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-700">
                    {totalActiveUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600">Users who created posts in period</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
              <Send className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {showSkeletons ? (
                <div className="space-y-2">
                  <div className="h-8 bg-purple-100 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-purple-100 rounded animate-pulse w-32"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-700">
                    {totalPublishedPosts.toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-600">Successfully published to social media</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {hasStripeData ? 'Paid Subscriptions' : 'Subscriptions'}
              </CardTitle>
              <Crown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {showSkeletons && !stripeData ? (
                <div className="space-y-2">
                  <div className="h-8 bg-orange-100 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-orange-100 rounded animate-pulse w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-700">
                    {totalSubscriptions.toLocaleString()}
                  </div>
                  <p className="text-xs text-orange-600">
                    {hasStripeData ? 'Active Stripe subscriptions' : 'Active subscribers'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="promo-codes" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Promo Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <SubscriptionAnalytics 
              data={subscriptionData} 
              loading={initialLoading} 
              currentTierCounts={currentStats.tier_counts}
              dateRange={dateRange}
              paidSubscribers={currentStats.paid_subscribers}
              promoSubscribers={currentStats.promo_subscribers}
            />
          </TabsContent>

          <TabsContent value="revenue">
            <IncomeAnalytics 
              data={incomeData} 
              loading={initialLoading} 
              revenueStats={{
                mrr: currentStats.mrr,
                estimated_revenue: currentStats.estimated_revenue,
                paid_subscribers: currentStats.paid_subscribers,
                tier_counts: currentStats.tier_counts
              }}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserActivityAnalytics 
              data={userActivityData} 
              loading={initialLoading} 
              currentStats={currentStats}
            />
          </TabsContent>

          <TabsContent value="content">
            <ContentAnalytics 
              data={contentData} 
              loading={initialLoading}
              contentStats={{
                total_posts: currentStats.total_posts,
                published_posts: currentStats.published_posts
              }}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="promo-codes">
            <PromoCodesManagement loading={initialLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
