-- Allow admins to view all posts for analytics purposes
CREATE POLICY "Admins can view all posts" 
ON public.posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));