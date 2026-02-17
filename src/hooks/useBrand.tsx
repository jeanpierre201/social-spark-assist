import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  voice_tone: string;
  color_primary: string | null;
  color_secondary: string | null;
  created_at: string;
  updated_at: string;
}

export const useBrand = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const brandQuery = useQuery({
    queryKey: ['brand', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Brand | null);
    },
    enabled: !!user,
  });

  const upsertBrandMutation = useMutation({
    mutationFn: async (brandData: Partial<Brand>) => {
      if (!user) throw new Error('Not authenticated');

      const existing = brandQuery.data;
      if (existing) {
        const { data, error } = await (supabase as any)
          .from('brands')
          .update({ ...brandData, user_id: user.id })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await (supabase as any)
          .from('brands')
          .insert({ ...brandData, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', user?.id] });
      toast({ title: 'Brand saved', description: 'Your brand profile has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    brand: brandQuery.data ?? null,
    isLoading: brandQuery.isLoading,
    upsertBrand: upsertBrandMutation.mutate,
    isSaving: upsertBrandMutation.isPending,
  };
};
