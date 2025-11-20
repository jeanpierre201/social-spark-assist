
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Settings, Home, ArrowLeft, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const StarterPlanPricing = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, subscriptionEnd, createCheckout, openCustomerPortal, loading } = useSubscription();
  const navigate = useNavigate();

  const features = [
    "Everything in Free Plan",
    "10 posts per month",
    "2 AI-generated images per post",
    "Post scheduling to all platforms",
    "Auto-create 10 posts at once",
    "Basic analytics",
    "Email support"
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Starter Plan</h1>
            <p className="text-muted-foreground">Perfect for getting started with social media</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
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
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>{feature}</span>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StarterPlanPricing;
