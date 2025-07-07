
-- Replace 'YOUR-ACTUAL-USER-ID' with the user ID from Supabase Auth for adminjp@test.com
UPDATE public.user_roles 
SET user_id = 'YOUR-ACTUAL-USER-ID'::uuid, 
    assigned_by = 'YOUR-ACTUAL-USER-ID'::uuid 
WHERE role = 'developer';
