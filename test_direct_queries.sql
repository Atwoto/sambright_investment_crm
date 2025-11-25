-- Test Queries Directly in Supabase SQL Editor
-- Run these one by one to identify the issue

-- ==============================================
-- Test 1: Basic projects query (no JOIN)
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
-- Test 2: Test clients query
-- ==============================================
SELECT
  id,
  name
FROM public.clients
ORDER BY name;

-- ==============================================
-- Test 3: Test projects with LIMIT only (no pagination)
-- ==============================================
SELECT
  id,
  project_number,
  name,
  client_id,
  description,
  project_type,
  status,
  start_date,
  end_date,
  estimated_budget,
  actual_cost,
  location,
  notes,
  images,
  video_link,
  created_at,
  color_palette
FROM public.projects
ORDER BY created_at DESC
LIMIT 12;

-- ==============================================
-- Test 4: Check RLS is enabled
-- ==============================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'projects';

-- ==============================================
-- Test 5: Test count query
-- ==============================================
SELECT
  count(*) as total_projects
FROM public.projects;
