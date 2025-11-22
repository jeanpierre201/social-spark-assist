
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
      
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription check timed out')), 10000);
      });
      
      // Race the function invocation against the timeout
      const invokePromise = supabase.functions.invoke('check-subscription');
      
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;
      
      console.log('Subscription check response:', { data, error });
      
      if (error) {
        console.error('Subscription check error:', error);
        
        // If it's an authentication error, logout the user
        if (error.message?.includes('Authentication') || 
            error.message?.includes('401') || 
            error.message?.includes('authorization')) {
          console.log('Authentication error detected, logging out user');
          toast({
            title: "Session Expired",
            description: "Please log in again to continue",
            variant: "destructive",
          });
          await logout();
          return;
        }
        
        // For other errors, set as free user and continue
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        return;
      }
      
      setSubscribed(data?.subscribed || false);
      setSubscriptionTier(data?.subscription_tier || null);
      setSubscriptionEnd(data?.subscription_end || null);
      
      console.log('Subscription status updated:', {
        subscribed: data?.subscribed || false,
        tier: data?.subscription_tier || null,
        end: data?.subscription_end || null
      });
      
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Set as free user on error to allow the app to continue
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
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
