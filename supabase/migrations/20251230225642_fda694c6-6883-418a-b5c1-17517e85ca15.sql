-- Allow admins to view all subscribers for analytics purposes
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));