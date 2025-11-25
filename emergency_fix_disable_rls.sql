-- EMERGENCY FIX: Temporarily Disable RLS on Projects Table
-- This will help identify if RLS is causing the timeout
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS on projects table
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Also disable on clients temporarily
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Check if it worked
SELECT 'RLS temporarily disabled on projects and clients tables' as status;
