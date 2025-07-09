
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Activity,
  Crown,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import SubscriptionAnalytics from './analytics/SubscriptionAnalytics';
import IncomeAnalytics from './analytics/IncomeAnalytics';
import UserActivityAnalytics from './analytics/UserActivityAnalytics';
import ContentAnalytics from './analytics/ContentAnalytics';
import PerformanceMetrics from './analytics/PerformanceMetrics';

const AdminDashboard = () => {
  const { userRole, loading: roleLoading, isAdmin } = useUserRole();
  const { subscriptionData, incomeData, userActivityData, contentData, currentStats, loading } = useAnalytics();
  const [syncing, setSyncing] = useState(false);

  const handleSyncAnalytics = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-analytics');
      if (error) throw error;
      toast.success('Analytics synced successfully');
      // Reload the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync analytics');
    } finally {
      setSyncing(false);
    }
  };

  if (roleLoading || loading) {
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

  const totalRevenue = latestIncomeData?.total_revenue || 0;
  const totalActiveUsers = latestUserActivityData?.total_active_users || 0;
  const totalPostsGenerated = currentStats.total_posts; // Use real posts count
  const totalSubscriptions = currentStats.total_active_subscribers; // Use real subscribers count

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
          <Button 
            onClick={handleSyncAnalytics} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Analytics'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {totalActiveUsers.toLocaleString()}
              </div>
              <p className="text-xs text-green-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {totalPostsGenerated.toLocaleString()}
              </div>
              <p className="text-xs text-purple-600">Posts created</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Crown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {totalSubscriptions.toLocaleString()}
              </div>
              <p className="text-xs text-orange-600">Active subscribers</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
          </TabsList>

          <TabsContent value="subscriptions">
            <SubscriptionAnalytics data={subscriptionData} loading={loading} />
          </TabsContent>

          <TabsContent value="revenue">
            <IncomeAnalytics data={incomeData} loading={loading} />
          </TabsContent>

          <TabsContent value="users">
            <UserActivityAnalytics data={userActivityData} loading={loading} />
          </TabsContent>

          <TabsContent value="content">
            <ContentAnalytics data={contentData} loading={loading} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
