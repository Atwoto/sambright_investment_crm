-- Query to get all CURRENT RLS policies for the profiles table
-- Run this in your Supabase SQL Editor

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
