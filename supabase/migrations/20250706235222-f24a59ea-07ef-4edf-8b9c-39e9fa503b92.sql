
-- Replace 'YOUR-ACTUAL-USER-ID' with the user ID from Supabase Auth for adminjp@test.com
UPDATE public.user_roles 
SET user_id = 'f3f0d627-6e5a-493c-b566-c0d3d23ff846'::uuid, 
    assigned_by = 'f3f0d627-6e5a-493c-b566-c0d3d23ff846'::uuid 
WHERE role = 'developer';
