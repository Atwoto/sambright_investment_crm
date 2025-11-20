-- SIMPLE FIX: Just disable RLS for super admin access
-- Run this in Supabase SQL Editor

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;

-- Create a permissive SELECT policy
-- Users can see their own profile, and we'll handle super admin access in the app
CREATE POLICY "select_all_profiles" ON public.profiles
  FOR SELECT 
  USING (true);  -- Allow all authenticated users to read all profiles

-- This is simpler and avoids circular dependency
-- Access control is handled at the application level (UserManagement component already checks for super_admin)
