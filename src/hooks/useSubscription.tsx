
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  refreshFromStripe: () => Promise<void>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  clearSubscriptionCache: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSubscriptionCache = () => {
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setLoading(false);
  };

  const checkSubscription = async () => {
    if (!user) {
      clearSubscriptionCache();
      return;
    }

    try {
      setLoading(true);
      console.log('Checking subscription for user:', user.email);
      
      // Read directly from database - much faster and more reliable
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Database query error:', error);
        // Default to free tier on error
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        return;
      }
      
      // If no record exists, user is free tier
      if (!data) {
        console.log('No subscription record found, defaulting to free tier');
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        return;
      }
      
      setSubscribed(data.subscribed || false);
      setSubscriptionTier(data.subscription_tier || null);
      setSubscriptionEnd(data.subscription_end || null);
      
      console.log('Subscription status loaded:', {
        subscribed: data.subscribed,
        tier: data.subscription_tier,
        end: data.subscription_end
      });
      
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Default to free tier on error
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshFromStripe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to refresh subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Refreshing...",
        description: "Syncing subscription status with Stripe",
      });

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw error;
      }
      
      // Refresh from database after Stripe sync
      await checkSubscription();
      
      toast({
        title: "Success",
        description: "Subscription status refreshed",
      });
    } catch (error) {
      console.error('Error refreshing from Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    }
  };

  const createCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      clearSubscriptionCache();
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      loading,
      checkSubscription,
      refreshFromStripe,
      createCheckout,
      openCustomerPortal,
      clearSubscriptionCache
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
