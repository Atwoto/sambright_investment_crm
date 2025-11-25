-- COMPLETE RLS FIX: Cleanup + New Simple Policies
-- Run this ONE FILE ONLY in Supabase SQL Editor

-- ==============================================
-- PART 1: CLEANUP - Remove ALL existing policies
-- ==============================================

-- Remove all policies from orders table
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

-- Remove all policies from products table
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

-- Remove all policies from suppliers table
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

-- Remove all policies from inventory_transactions table
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

-- Remove all policies from projects, clients, profiles
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_staff" ON public.projects;
DROP POLICY IF EXISTS "projects_update_staff" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;

DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_modify_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_update_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- ==============================================
-- PART 2: Enable RLS on All Tables
-- ==============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PART 3: Create SIMPLE, Minimal RLS Policies
-- ==============================================

-- Profiles: Allow users to see their own profile only
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO public
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Projects: Allow all authenticated users to read, staff to modify
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "projects_insert_staff" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Simplified: allow all authenticated users

CREATE POLICY "projects_update_staff" ON public.projects
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);  -- Simplified: allow all authenticated users

CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'production')));

-- Clients: Allow all authenticated users full access
CREATE POLICY "clients_select_authenticated" ON public.clients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "clients_insert_authenticated" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "clients_update_authenticated" ON public.clients
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients_delete_authenticated" ON public.clients
  FOR DELETE TO authenticated
  USING (true);

-- Products: Allow all authenticated users full access
CREATE POLICY "products_select_authenticated" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_insert_authenticated" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_authenticated" ON public.products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_delete_authenticated" ON public.products
  FOR DELETE TO authenticated
  USING (true);

-- Orders: Allow all authenticated users full access
CREATE POLICY "orders_select_authenticated" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_insert_authenticated" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "orders_update_authenticated" ON public.orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_delete_authenticated" ON public.orders
  FOR DELETE TO authenticated
  USING (true);

-- Suppliers: Allow all authenticated users full access
CREATE POLICY "suppliers_select_authenticated" ON public.suppliers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "suppliers_insert_authenticated" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "suppliers_update_authenticated" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "suppliers_delete_authenticated" ON public.suppliers
  FOR DELETE TO authenticated
  USING (true);

-- Inventory transactions: Allow all authenticated users full access
CREATE POLICY "inventory_select_authenticated" ON public.inventory_transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_insert_authenticated" ON public.inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==============================================
-- PART 4: Grant Permissions
-- ==============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT ON public.inventory_transactions TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==============================================
-- PART 5: Optimize Performance
-- ==============================================

ANALYZE public.projects;
ANALYZE public.clients;
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.suppliers;
ANALYZE public.inventory_transactions;
ANALYZE public.profiles;

-- Success message
SELECT 'Complete RLS fix applied! All policies cleaned up and recreated with simplified rules.' as status;

-- Count policies to verify
SELECT
  tablename,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'clients', 'profiles', 'orders', 'products', 'suppliers', 'inventory_transactions')
GROUP BY tablename
ORDER BY tablename;
