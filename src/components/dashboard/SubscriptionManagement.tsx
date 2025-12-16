import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, Calendar, Trash2, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

const SubscriptionManagement = () => {
  const { subscriptionTier, subscriptionEnd, openCustomerPortal, subscribed } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasStripeCustomer, setHasStripeCustomer] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStripeCustomer = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('stripe_customer_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setHasStripeCustomer(!!data?.stripe_customer_id);
      } catch (error) {
        console.error('Error checking Stripe customer:', error);
        setHasStripeCustomer(false);
      } finally {
        setLoading(false);
      }
    };

    checkStripeCustomer();
  }, [user]);

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
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              <span>Subscription Management</span>
            </CardTitle>
            <CardDescription className="text-sm">Manage your subscription and billing</CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={`bg-${tierColor}-100 text-${tierColor}-800 w-fit`}
          >
            {subscriptionTier} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionEnd && !isFreeUser && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Renews on {formatDate(subscriptionEnd)}</span>
          </div>
        )}
        
        <div className="pt-2">
          {isFreeUser ? (
            <>
              <Button 
                onClick={handleCancelFreeAccount}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Free Account
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This will log you out. Contact support to permanently delete your data.
              </p>
            </>
          ) : (
            <>
              {loading ? (
                <Button variant="outline" className="w-full" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Loading...
                </Button>
              ) : hasStripeCustomer ? (
                <>
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
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Test Account</p>
                      <p className="mt-1">This is a manually created test subscription without Stripe billing. To access billing management, upgrade through the normal checkout flow.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/upgrade-pro')}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
