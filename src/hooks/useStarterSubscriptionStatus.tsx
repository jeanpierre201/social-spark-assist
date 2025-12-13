
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStarterSubscriptionStatus = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const { toast } = useToast();
  const [monthlyPosts, setMonthlyPosts] = useState(0);
  const [previousPeriodPosts, setPreviousPeriodPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [canCreatePosts, setCanCreatePosts] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const checkSubscriptionAndLimits = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Check subscription status and get subscription details
        const { data: subscriberData, error: subscriberError } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subscriberError && subscriberError.code !== 'PGRST116') {
          throw subscriberError;
        }

        let subscriptionStart: string | null = null;
        let isWithinCreationWindow = false;
        let remainingDays = 0;

        if (subscriberData && subscriberData.subscribed && 
            (subscriberData.subscription_tier === 'Starter' || subscriberData.subscription_tier === 'Pro')) {
          
          // Get subscription start date from created_at or updated_at when subscription became active
          subscriptionStart = subscriberData.created_at;
          setSubscriptionStartDate(subscriptionStart);

          // Calculate if we're within 30 days of subscription start
          const startDate = new Date(subscriptionStart);
          const currentDate = new Date();
          const daysDifference = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          isWithinCreationWindow = daysDifference <= 30;
          remainingDays = Math.max(0, 30 - daysDifference);
          
          console.log('Subscription check:', {
            startDate: startDate.toISOString(),
            currentDate: currentDate.toISOString(),
            daysDifference,
            isWithinCreationWindow,
            remainingDays
          });
        }

        setCanCreatePosts(isWithinCreationWindow);
        setDaysRemaining(remainingDays);

        // Get current and previous period post counts using database query
        if (subscriptionStart) {
          // Get current period posts count (30 days from subscription start)
          const startDate = new Date(subscriptionStart);
          const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const { data: currentPosts, error: currentError } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          if (currentError) throw currentError;
          setMonthlyPosts(currentPosts?.length || 0);

          // Get previous period posts count (30 days before subscription start)
          const previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          const { data: previousPosts, error: previousError } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', previousStartDate.toISOString())
            .lt('created_at', startDate.toISOString());

          if (previousError) throw previousError;
          setPreviousPeriodPosts(previousPosts?.length || 0);
        }
        
      } catch (error) {
        console.error('Error checking subscription and limits:', error);
        toast({
          title: "Error",
          description: "Failed to check subscription status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionAndLimits();
  }, [user, subscribed, subscriptionTier, toast]);

  return {
    monthlyPosts,
    setMonthlyPosts,
    previousPeriodPosts,
    isLoading,
    subscriptionStartDate,
    canCreatePosts,
    daysRemaining
  };
};
