import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useProSubscriptionStatus } from '@/hooks/useProSubscriptionStatus';

interface SubscriptionStatusBadgeProps {
  className?: string;
}

const SubscriptionStatusBadge = ({ className }: SubscriptionStatusBadgeProps) => {
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { canCreatePosts, daysRemaining } = useProSubscriptionStatus();

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        Loading...
      </Badge>
    );
  }

  // Determine status based on subscription data
  const getStatusInfo = () => {
    if (!subscriptionTier || subscriptionTier === 'Free') {
      return {
        label: 'Free',
        variant: 'secondary' as const,
        description: 'Free tier'
      };
    }

    if (subscriptionTier === 'Starter' || subscriptionTier === 'Pro') {
      // Active: Can create posts (within 30-day window and subscribed)
      if (subscribed && canCreatePosts) {
        return {
          label: 'Active',
          variant: 'default' as const,
          description: `${subscriptionTier} - ${daysRemaining} days remaining`
        };
      }

      // View Only: Has subscription but creation period ended
      if (subscribed && !canCreatePosts) {
        return {
          label: 'View Only',
          variant: 'outline' as const,
          description: `${subscriptionTier} - Creation period ended`
        };
      }

      // Expired: Payment stopped
      return {
        label: 'Expired',
        variant: 'destructive' as const,
        description: `${subscriptionTier} - Subscription expired`
      };
    }

    return {
      label: 'Unknown',
      variant: 'outline' as const,
      description: 'Status unavailable'
    };
  };

  const status = getStatusInfo();

  return (
    <Badge 
      variant={status.variant} 
      className={className}
      title={status.description}
    >
      {status.label}
    </Badge>
  );
};

export default SubscriptionStatusBadge;
