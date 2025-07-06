
-- Replace 'your-user-id-here' with the actual user ID from step 1
-- Replace 'your-admin-email@example.com' with your email
INSERT INTO public.user_roles (user_id, role, assigned_by) 
VALUES (
  'your-user-id-here'::uuid, 
  'developer', 
  'your-user-id-here'::uuid
);
