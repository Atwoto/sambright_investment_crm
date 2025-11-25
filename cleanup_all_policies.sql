-- COMPREHENSIVE CLEANUP: Remove ALL RLS Policies from ALL Tables
-- Run this first, then run fix_rls_final.sql
-- This ensures no policy conflicts

-- ==============================================
-- DROP ALL POLICIES FROM ALL TABLES
-- ==============================================

-- Drop all policies from orders table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.orders;';
    END LOOP;
END $$;

-- Drop all policies from products table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.products;';
    END LOOP;
END $$;

-- Drop all policies from suppliers table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.suppliers;';
    END LOOP;
END $$;

-- Drop all policies from inventory_transactions table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_transactions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.inventory_transactions;';
    END LOOP;
END $$;

-- ==============================================
-- CONFIRM CLEANUP
-- ==============================================
SELECT
  'Cleanup complete. All policies removed from orders, products, suppliers, inventory_transactions.' as status;

-- Verify no policies remain (should return 0 rows for these tables)
SELECT
  tablename,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products', 'suppliers', 'inventory_transactions')
GROUP BY tablename
ORDER BY tablename;
