
-- Replace 'ACTUAL-USER-ID-HERE' with the user ID from Supabase Auth
UPDATE public.user_roles 
SET user_id = 'ACTUAL-USER-ID-HERE'::uuid, 
    assigned_by = 'ACTUAL-USER-ID-HERE'::uuid 
WHERE role = 'developer';
