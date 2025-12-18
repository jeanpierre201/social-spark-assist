
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Settings, Home, ArrowLeft, Sparkles, Zap, BarChart3, Users } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useProUpgrade } from '@/hooks/useProUpgrade';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';

const ProPlanPricing = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, subscriptionEnd, openCustomerPortal, loading } = useSubscription();
  const { createProCheckout } = useProUpgrade();
  const navigate = useNavigate();

  const features = [
    { icon: Sparkles, text: "Unlimited posts per month" },
    { icon: Zap, text: "Multiple content variations (3-5 versions per post)" },
    { icon: BarChart3, text: "Advanced analytics & insights" },
    { icon: Users, text: "Team collaboration tools" },
    { icon: Crown, text: "Priority support" },
    { icon: Check, text: "Auto-posting to all platforms" },
    { icon: Check, text: "Custom branding options" },
    { icon: Check, text: "Advanced AI optimization" }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await createProCheckout();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Pro Plan</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Unlock advanced AI features and unlimited possibilities</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleGoBack} size="sm" className="flex items-center gap-1 sm:gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleGoHome} size="sm" className="flex items-center gap-1 sm:gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className={`w-full max-w-lg ${isProUser ? 'border-purple-500 bg-purple-50' : 'border-purple-200'}`}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Crown className="h-8 w-8 text-purple-600" />
                <CardTitle className="text-3xl">Pro Plan</CardTitle>
                {isProUser && <Badge variant="secondary" className="bg-purple-100 text-purple-800">Active</Badge>}
              </div>
              <CardDescription className="text-lg">
                Advanced AI features for growing businesses
              </CardDescription>
              <div className="text-4xl font-bold text-purple-600">
                €25<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <feature.icon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {isProUser ? (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    Current Plan: <strong className="text-purple-600">{subscriptionTier}</strong>
                    {subscriptionEnd && (
                      <div>Renews on {formatDate(subscriptionEnd)}</div>
                    )}
                  </div>
                  <Button 
                    onClick={openCustomerPortal} 
                    variant="outline" 
                    className="w-full border-purple-200 hover:bg-purple-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={handleUpgrade} 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    {isStarterUser ? 'Upgrade to Pro' : 'Get Pro Plan'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Cancel anytime
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Promo Code Section */}
        {!isProUser && (
          <div className="mt-8 max-w-lg mx-auto">
            <PromoCodeRedemption onSuccess={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProPlanPricing;
