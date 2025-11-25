-- Diagnostic Queries to Identify Timeout Issues
-- Run these in Supabase SQL Editor one by one

-- ==============================================
-- 1. Check if projects table has data
-- ==============================================
SELECT
  'projects' as table_name,
  count(*) as total_rows
FROM public.projects;

-- ==============================================
-- 2. Check clients table
-- ==============================================
SELECT
  'clients' as table_name,
  count(*) as total_rows
FROM public.clients;

-- ==============================================
-- 3. Test basic projects query (no JOIN)
-- ==============================================
SELECT
  id,
  project_number,
  name,
  client_id,
  status,
  created_at
FROM public.projects
ORDER BY created_at DESC
LIMIT 5;

-- ==============================================
-- 4. Test projects with clients JOIN
-- ==============================================
SELECT
  p.id,
  p.project_number,
  p.name,
  c.name as client_name
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
ORDER BY p.created_at DESC
LIMIT 5;

-- ==============================================
-- 5. Check RLS status on all tables
-- ==============================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'clients', 'profiles', 'orders', 'products', 'suppliers')
ORDER BY tablename;

-- ==============================================
-- 6. Check how many RLS policies exist
-- ==============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'clients', 'profiles')
ORDER BY tablename, policyname;

-- ==============================================
-- 7. Test if profiles table query works
-- ==============================================
SELECT
  id,
  email,
  role
FROM public.profiles
LIMIT 5;

-- ==============================================
-- 8. Check for any long-running queries
-- ==============================================
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;
