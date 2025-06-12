
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Settings } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const StarterPlanPricing = () => {
  const { subscribed, subscriptionTier, subscriptionEnd, createCheckout, openCustomerPortal, loading } = useSubscription();

  const features = [
    "Unlimited AI content generation",
    "Social media scheduling",
    "Advanced analytics",
    "AI image creation",
    "Multi-platform posting",
    "Priority support"
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading subscription status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${subscribed ? 'border-green-500 bg-green-50' : ''}`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Crown className="h-6 w-6 text-yellow-600" />
          <CardTitle className="text-2xl">Starter Plan</CardTitle>
          {subscribed && <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>}
        </div>
        <CardDescription>
          Perfect for growing your social media presence
        </CardDescription>
        <div className="text-3xl font-bold">
          $19.99<span className="text-lg font-normal text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {subscribed ? (
          <div className="space-y-3">
            <div className="text-center text-sm text-muted-foreground">
              Current Plan: <strong>{subscriptionTier}</strong>
              {subscriptionEnd && (
                <div>Renews on {formatDate(subscriptionEnd)}</div>
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
        ) : (
          <Button 
            onClick={createCheckout} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Starter
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StarterPlanPricing;
