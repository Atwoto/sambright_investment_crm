-- TEMPORARY: Disable RLS to test if that's the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
