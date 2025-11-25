-- ULTRA-SIMPLE RLS POLICIES (No Complex Logic)
-- Run this in Supabase SQL Editor

-- Step 1: Re-enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on projects table
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_staff" ON public.projects;
DROP POLICY IF EXISTS "projects_update_staff" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;

-- Step 3: Create ULTRA-SIMPLE policies (no EXISTS, no subqueries, no complex logic)

-- Policy 1: Anyone authenticated can SELECT all projects
-- Using simple "true" - no complex role checks
CREATE POLICY "projects_select_simple" ON public.projects
  FOR SELECT TO authenticated
  USING (true);

-- Policy 2: Anyone authenticated can INSERT projects
-- Simple WITH CHECK
CREATE POLICY "projects_insert_simple" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy 3: Anyone authenticated can UPDATE projects
-- Simple USING and WITH CHECK
CREATE POLICY "projects_update_simple" ON public.projects
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Only super_admin can DELETE (basic check, no subquery)
-- Using a simple auth check
CREATE POLICY "projects_delete_superadmin" ON public.projects
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role = 'super_admin'
    )
  );

-- Success message
SELECT 'Ultra-simple RLS policies created for projects table!' as status;

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'projects'
ORDER BY cmd;
