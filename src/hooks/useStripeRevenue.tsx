import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface StripeRevenueData {
  totalRevenue: number;
  mrr: number;
  totalTransactions: number;
  activeSubscriptions: number;
  subscriberCounts: {
    starter: number;
    pro: number;
  };
  availableBalance: number;
  pendingBalance: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    created: string;
    customer: string | null;
    description: string | null;
  }>;
  dailyRevenue: Array<{
    date: string;
    amount: number;
  }>;
  annualRunRate: number;
  avgRevenuePerSubscriber: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface UseStripeRevenueOptions {
  dateRange?: DateRange;
  enabled?: boolean;
}

export const useStripeRevenue = (options: UseStripeRevenueOptions = {}) => {
  const { dateRange, enabled = true } = options;
  
  const [stripeData, setStripeData] = useState<StripeRevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromDateStr = useMemo(() => 
    dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    [dateRange?.from?.getTime()]
  );
  
  const toDateStr = useMemo(() => 
    dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    [dateRange?.to?.getTime()]
  );

  const fetchStripeRevenue = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching Stripe revenue data...');
      
      const { data, error: fnError } = await supabase.functions.invoke('get-stripe-revenue', {
        body: { fromDate: fromDateStr, toDate: toDateStr }
      });

      if (fnError) {
        console.error('Error fetching Stripe revenue:', fnError);
        setError(fnError.message);
        return;
      }

      if (data?.error) {
        console.error('Stripe API error:', data.error);
        setError(data.error);
        return;
      }

      console.log('Stripe revenue data received:', data);
      setStripeData(data);
    } catch (err) {
      console.error('Error calling Stripe revenue function:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [enabled, fromDateStr, toDateStr]);

  return {
    stripeData,
    loading,
    error,
    refetch: fetchStripeRevenue
  };
};
