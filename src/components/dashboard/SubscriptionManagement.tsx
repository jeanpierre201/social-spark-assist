import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, Calendar } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionManagement = () => {
  const { subscriptionTier, subscriptionEnd, openCustomerPortal } = useSubscription();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tierColor = subscriptionTier === 'Pro' ? 'purple' : 'blue';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={`bg-${tierColor}-100 text-${tierColor}-800`}
          >
            {subscriptionTier} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Renews on {formatDate(subscriptionEnd)}</span>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            onClick={openCustomerPortal}
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Subscription & Billing
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Update payment method, view invoices, or cancel subscription
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
