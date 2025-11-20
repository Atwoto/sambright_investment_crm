-- Check what these trigger functions do
-- Run this in Supabase SQL Editor

-- Check the create_missing_profile function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'create_missing_profile';

-- Check the handle_new_user function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check if there are any missing profiles for existing users
SELECT 
    u.id,
    u.email,
    p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.deleted_at IS NULL;

-- Check for duplicate profiles
SELECT id, COUNT(*)
FROM public.profiles
GROUP BY id
HAVING COUNT(*) > 1;

-- RECOMMENDED FIX: Drop one of the duplicate triggers
-- Uncomment and run after reviewing the functions above

-- DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then recreate just ONE trigger with a proper function
-- (We'll do this after seeing what the functions do)
