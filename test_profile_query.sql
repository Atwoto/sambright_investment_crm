-- Test the exact query that's timing out
-- Replace YOUR_USER_ID with your actual user ID

-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'sambright@gmail.com';

-- Then test the profile query (replace the ID)
EXPLAIN ANALYZE
SELECT id, email, name, role, created_at
FROM public.profiles
WHERE id = 'd4a980bd-02c3-446c-834e-b90c4ba992fe';

-- Check if there are indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- Check table stats
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'profiles';
