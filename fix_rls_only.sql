-- Fix RLS Policies Only (No Indexes - they already exist!)
-- Run this in your Supabase SQL Editor

-- ==============================================
-- PART 1: Fix Circular Dependencies in RLS
-- ==============================================

-- Drop all existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only super admins can delete profiles" ON public.profiles;

-- Create SIMPLE, non-circular policies
-- Policy 1: Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow inserts via trigger (no direct user inserts)
-- The handle_new_user() trigger will handle this with SECURITY DEFINER

-- Policy 4: No delete policy - only service_role can delete

-- ==============================================
-- PART 2: Enable RLS on Other Tables
-- ==============================================

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory_transactions table
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PART 3: Create Simple RLS Policies for All Tables
-- ==============================================

-- Projects policies - Allow all authenticated users to read, staff to modify
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "projects_insert_staff" ON public.projects;
CREATE POLICY "projects_insert_staff" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'field', 'customer_service')
    )
  );

DROP POLICY IF EXISTS "projects_update_staff" ON public.projects;
CREATE POLICY "projects_update_staff" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'field', 'customer_service')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'field', 'customer_service')
    )
  );

DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- Clients policies
DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients;
CREATE POLICY "clients_select_authenticated" ON public.clients
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "clients_modify_staff" ON public.clients;
CREATE POLICY "clients_modify_staff" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  );

CREATE POLICY "clients_update_staff" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  );

CREATE POLICY "clients_delete_admin" ON public.clients
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- Orders policies
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;
CREATE POLICY "orders_select_authenticated" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_insert_staff" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  );

CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production', 'customer_service')
    )
  );

CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- Products policies
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_modify_staff" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

CREATE POLICY "products_update_staff" ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- Suppliers policies
DROP POLICY IF EXISTS "suppliers_select_authenticated" ON public.suppliers;
CREATE POLICY "suppliers_select_authenticated" ON public.suppliers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "suppliers_modify_staff" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

CREATE POLICY "suppliers_update_staff" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

CREATE POLICY "suppliers_delete_admin" ON public.suppliers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- Inventory transactions policies
DROP POLICY IF EXISTS "inventory_transactions_select_authenticated" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_select_authenticated" ON public.inventory_transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_transactions_insert_staff" ON public.inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'production')
    )
  );

-- ==============================================
-- PART 4: Grant Permissions
-- ==============================================

-- Grant necessary permissions to authenticated role
GRANT SELECT ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;

GRANT SELECT ON public.clients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clients TO authenticated;

GRANT SELECT ON public.orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.orders TO authenticated;

GRANT SELECT ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT ON public.suppliers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;

GRANT SELECT, INSERT ON public.inventory_transactions TO authenticated;

-- Service role gets all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==============================================
-- PART 5: Optimize Query Performance
-- ==============================================

-- Set a timeout for queries (in milliseconds)
-- This prevents runaway queries from hanging the application
ALTER SYSTEM SET statement_timeout = '30s';

-- ANALYZE tables to update statistics for query planner
ANALYZE public.projects;
ANALYZE public.clients;
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.suppliers;
ANALYZE public.inventory_transactions;
ANALYZE public.profiles;

-- Success message
SELECT 'RLS policies fixed successfully! Indexes already exist.' as status;
