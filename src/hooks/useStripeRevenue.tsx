import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fromDateStr = useMemo(() => 
    dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    [dateRange?.from?.getTime()]
  );
  
  const toDateStr = useMemo(() => 
    dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    [dateRange?.to?.getTime()]
  );

  const fetchStripeRevenue = useCallback(async () => {
    if (!enabled) {
      setInitialLoading(false);
      return;
    }

    // Use refreshing state for subsequent fetches, initialLoading for first
    if (hasFetched.current) {
      setRefreshing(true);
    }
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
      hasFetched.current = true;
    } catch (err) {
      console.error('Error calling Stripe revenue function:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [enabled, fromDateStr, toDateStr]);

  // Auto-fetch on mount and when date range changes
  useEffect(() => {
    fetchStripeRevenue();
  }, [fetchStripeRevenue]);

  return {
    stripeData,
    loading: initialLoading, // For backward compatibility
    initialLoading,
    refreshing,
    error,
    refetch: fetchStripeRevenue
  };
};
