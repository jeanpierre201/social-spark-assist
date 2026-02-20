import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import StarterDashboardNav from '@/components/dashboard/StarterDashboardNav';

const DashboardSubscriptionPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const proStatus = useProSubscriptionStatus();
  const starterStatus = useStarterSubscriptionStatus();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (isProUser || isStarterUser);

  const status = isProUser ? proStatus : starterStatus;
  const maxPosts = isProUser ? 100 : 10;

  if (loading || status.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Subscription" showLogout={true} />
        {isProUser && <ProDashboardNav />}
        {isStarterUser && <StarterDashboardNav />}

        {/* Usage Indicators for paid plans */}
        {hasAnyPlan && (
          <UsageIndicators
            monthlyPosts={status.monthlyPosts}
            previousPeriodPosts={status.previousPeriodPosts}
            daysRemaining={status.daysRemaining}
            maxPosts={maxPosts}
            isProPlan={isProUser}
            subscriptionStartDate={status.subscriptionStartDate}
            canCreatePosts={status.canCreatePosts}
          />
        )}

        <SubscriptionManagement />
      </div>
    </div>
  );
};

export default DashboardSubscriptionPage;
