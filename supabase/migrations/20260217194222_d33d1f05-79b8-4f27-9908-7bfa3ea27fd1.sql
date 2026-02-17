
-- Drop the vulnerable select_own_subscription policy that allows email-based probing
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Drop and recreate the read policy to only use user_id (no email-based access)
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscribers;
CREATE POLICY "Users can read own subscription"
ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

-- Keep admin access
-- "Admins can view all subscribers" already exists and is fine

-- Tighten insert policy to only use user_id
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
CREATE POLICY "Users can insert their own subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Tighten update policy to only use user_id
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
