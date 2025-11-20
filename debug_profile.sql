-- Check if profile exists for this user
SELECT * FROM public.profiles WHERE id = 'd4a989bd-02c3-446c-83d6-b59c40a592fe';

-- Check all profiles (run as service role or disable RLS temporarily)
SELECT id, email, name, role FROM public.profiles;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Temporarily disable RLS to test (ONLY FOR DEBUGGING)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
