import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import SocialMediaSettings from '@/components/SocialMediaSettings';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import StarterDashboardNav from '@/components/dashboard/StarterDashboardNav';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';

const DashboardSocialPage = () => {
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

  if (!subscribed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Social Media" showLogout={false} />
          <UpgradePrompt />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Social Media" showLogout={false} />
        {isProUser && <ProDashboardNav />}
        {isStarterUser && <StarterDashboardNav />}
        <SocialMediaSettings />
      </div>
    </div>
  );
};

export default DashboardSocialPage;
