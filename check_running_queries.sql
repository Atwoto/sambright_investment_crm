-- Check for long-running queries on the profiles table
-- Run this in Supabase SQL Editor

SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND query ILIKE '%profiles%'
ORDER BY duration DESC;

-- Also check for locks on the profiles table
SELECT 
    l.locktype,
    l.mode,
    l.granted,
    l.pid,
    a.query,
    a.state
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation = 'profiles'::regclass
ORDER BY l.granted, l.pid;
