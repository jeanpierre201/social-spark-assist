-- Fix subscribers table RLS policies to prevent unauthorized access

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure INSERT policy - only authenticated users can insert their own records
CREATE POLICY "Users can insert their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR email = auth.email())
);

-- Create secure UPDATE policy - only allow authenticated users to update their own records
CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR email = auth.email())
);

-- Ensure edge functions can still operate using service role key (bypasses RLS)
-- No additional policy needed as service role bypasses RLS policies