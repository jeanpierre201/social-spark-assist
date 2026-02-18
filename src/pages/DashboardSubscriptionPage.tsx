
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';
import { useStarterSubscriptionStatus } from '@/hooks/useStarterSubscriptionStatus';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileAvatar from '@/components/ProfileAvatar';
import SubscriptionStatusBadge from '@/components/SubscriptionStatusBadge';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import UsageIndicators from '@/components/starter/UsageIndicators';
import ProDashboardNav from '@/components/dashboard/ProDashboardNav';
import PageTitleCard from '@/components/dashboard/PageTitleCard';

const DashboardSubscriptionPage = () => {
  const { user, logout } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const proStatus = useProSubscriptionStatus();
  const starterStatus = useStarterSubscriptionStatus();

  const navigate = useNavigate();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (isProUser || isStarterUser);

  // Pick the right subscription status
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
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Subscription</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
              <ProfileAvatar />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
            <div className="flex items-center gap-2">
              <SubscriptionStatusBadge />
            </div>
          </div>
        </div>

        {/* Pro nav */}
        {isProUser && <ProDashboardNav />}

        <PageTitleCard
          icon={CreditCard}
          title="Subscription"
          description="Manage your plan, billing, and usage."
        />

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

        {/* Subscription Management */}
        <SubscriptionManagement />
      </div>
    </div>
  );
};

export default DashboardSubscriptionPage;
