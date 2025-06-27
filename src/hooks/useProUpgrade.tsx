
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProUpgrade = () => {
  const { checkSubscription } = useSubscription();
  const { toast } = useToast();

  const createProCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-pro-checkout');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        // Refresh subscription status after a delay to account for potential upgrade
        setTimeout(() => {
          checkSubscription();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating Pro checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create Pro checkout session",
        variant: "destructive",
      });
    }
  };

  return { createProCheckout };
};
