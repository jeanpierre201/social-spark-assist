import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, Calendar, Trash2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SubscriptionManagement = () => {
  const { subscriptionTier, subscriptionEnd, openCustomerPortal, subscribed } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCancelFreeAccount = async () => {
    if (!confirm('Are you sure you want to cancel your free account? This will delete all your data.')) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Account session ended",
        description: "Your session has been logged out. Contact support to delete your account permanently.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tierColor = subscriptionTier === 'Pro' ? 'purple' : subscriptionTier === 'Starter' ? 'blue' : 'gray';
  const isFreeUser = !subscribed || subscriptionTier === 'Free';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Column 1: Subscription Tier */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Current Plan</span>
            <Badge 
              variant="secondary" 
              className={`bg-${tierColor}-100 text-${tierColor}-800 w-fit`}
            >
              {subscriptionTier} Plan
            </Badge>
          </div>

          {/* Column 2: Renewal Date */}
          <div className="flex flex-col gap-1">
            {subscriptionEnd && !isFreeUser ? (
              <>
                <span className="text-sm text-muted-foreground">Renewal Date</span>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(subscriptionEnd)}</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm">Free tier</span>
              </>
            )}
          </div>

          {/* Column 3: Action Button */}
          <div className="flex flex-col gap-2">
            {isFreeUser ? (
              <>
                <Button 
                  onClick={handleCancelFreeAccount}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Contact support to delete data
                </p>
              </>
            ) : (
              <>
                <Button 
                  onClick={openCustomerPortal}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Update payment or cancel
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
