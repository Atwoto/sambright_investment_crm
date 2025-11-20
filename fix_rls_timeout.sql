-- Fix RLS timeout issue by removing circular dependency
-- Run this in your Supabase SQL Editor

-- Drop the problematic policies that cause circular dependency
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for super admins only" ON public.profiles;

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop if exists and recreate
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create a simple SELECT policy without circular dependency
-- Users can ONLY read their own profile (no super admin check that causes timeout)
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Keep the existing working policies:
-- "Enable insert for authenticated users via trigger" - already exists, works fine
-- "Enable update for own profile" - already exists, works fine

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
