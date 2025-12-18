
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Settings, Home, ArrowLeft, Zap, Calendar, Image, Clock, BarChart, Mail, Package } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';

const StarterPlanPricing = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, subscriptionEnd, createCheckout, openCustomerPortal, loading } = useSubscription();
  const navigate = useNavigate();

  const features = [
    { icon: Package, text: "Everything in Free Plan" },
    { icon: Calendar, text: "10 posts per month" },
    { icon: Image, text: "2 AI-generated images per post" },
    { icon: Clock, text: "Post scheduling to all platforms" },
    { icon: Zap, text: "Auto-create 10 posts at once" },
    { icon: BarChart, text: "Basic analytics" },
    { icon: Mail, text: "Email support" }
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
    await createCheckout();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const isProUser = subscribed && subscriptionTier === 'Pro';

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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Starter Plan</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Perfect for getting started with social media</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleGoBack} size="sm" className="flex items-center gap-1 sm:gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleGoHome} size="sm" className="flex items-center gap-1 sm:gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className={`w-full max-w-lg ${isStarterUser ? 'border-blue-500 bg-blue-50' : 'border-blue-200'}`}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-3xl">Starter Plan</CardTitle>
                {isStarterUser && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>}
              </div>
              <CardDescription className="text-lg">
                Ideal for small businesses and creators
              </CardDescription>
              <div className="text-4xl font-bold text-blue-600">
                €12<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <feature.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              {isStarterUser ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Current Plan: <strong className="text-blue-700">{subscriptionTier}</strong>
                    </p>
                    {subscriptionEnd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Renews on {formatDate(subscriptionEnd)}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={openCustomerPortal} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              ) : isProUser ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700 font-semibold">
                      You're currently on the Pro Plan
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enjoying more features and unlimited posts
                    </p>
                  </div>
                  <Button 
                    onClick={openCustomerPortal} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={handleUpgrade} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Get Starter Plan
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Cancel anytime
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Promo Code Section */}
        {!isStarterUser && !isProUser && (
          <div className="mt-8 max-w-lg mx-auto">
            <PromoCodeRedemption onSuccess={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StarterPlanPricing;
