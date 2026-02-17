import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import ProAnalytics from '@/components/ProAnalytics';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';

const DashboardAnalyticsPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isProUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} />
          <UpgradePrompt />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} />
        <ProDashboardNav />
        <ProAnalytics />
      </div>
    </div>
  );
};

export default DashboardAnalyticsPage;
