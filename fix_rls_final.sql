-- FINAL FIX: Remove circular dependency in RLS policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for super admins only" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users via trigger" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Step 2: Create simple, non-circular policies

-- SELECT: Users can read their own profile
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- INSERT: Allow authenticated users to insert their own profile
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile
CREATE POLICY "delete_own_profile" ON public.profiles
  FOR DELETE 
  USING (auth.uid() = id);

-- Step 3: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 4: Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
