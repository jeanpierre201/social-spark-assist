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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const tierColor = subscriptionTier === 'Pro' ? 'purple' : subscriptionTier === 'Starter' ? 'blue' : 'gray';
  const isFreeUser = !subscribed || subscriptionTier === 'Free';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <CreditCard className="h-5 w-5 mr-2" />
            Subscription
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`bg-${tierColor}-100 text-${tierColor}-800 text-xs`}
          >
            {subscriptionTier || 'Free'}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {isFreeUser ? 'Manage your free account' : 'Manage billing and subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscriptionEnd && !isFreeUser && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Renews {formatDate(subscriptionEnd)}</span>
          </div>
        )}
        
        {isFreeUser ? (
          <Button 
            onClick={handleCancelFreeAccount}
            variant="outline"
            className="w-full text-sm"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Account
          </Button>
        ) : (
          <Button 
            onClick={openCustomerPortal}
            variant="outline"
            className="w-full text-sm"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
