import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

export const usePromoCode = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { checkSubscription } = useSubscription();

  const redeemPromoCode = async (promoCode: string): Promise<boolean> => {
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to redeem a promo code",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('redeem-promo-code', {
        body: { promoCode: promoCode.trim() },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error redeeming promo code:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to redeem promo code",
          variant: "destructive",
        });
        return false;
      }

      if (!data.success) {
        toast({
          title: "Invalid Code",
          description: data.error || "This promo code is not valid",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success! 🎉",
        description: data.message,
      });

      // Refresh subscription status
      await checkSubscription();
      
      return true;
    } catch (error) {
      console.error('Unexpected error redeeming promo code:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { redeemPromoCode, loading };
};
