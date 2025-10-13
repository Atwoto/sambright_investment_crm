-- Database Verification Script
-- Run this in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if all required tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'clients', 'orders', 'suppliers', 'inventory_transactions')
ORDER BY table_name;

-- 2. Check products table structure (especially min_stock_level column)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any products with stock data
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN stock_level IS NOT NULL THEN 1 END) as products_with_stock,
  COUNT(CASE WHEN min_stock_level IS NOT NULL THEN 1 END) as products_with_min_stock,
  COUNT(CASE WHEN stock_level < min_stock_level THEN 1 END) as low_stock_items
FROM products;

-- 4. Sample query to test the low stock logic
SELECT 
  id,
  name,
  stock_level,
  min_stock_level,
  (stock_level < min_stock_level) as is_low_stock
FROM products 
WHERE stock_level IS NOT NULL 
  AND min_stock_level IS NOT NULL
LIMIT 5;

-- 5. Check orders table structure (you already provided this)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Insert sample data if products table is empty
-- Run this only if the products table exists but has no data
INSERT INTO products (
  product_type, name, stock_level, min_stock_level, 
  unit_price, category, status
) VALUES 
  ('paint', 'Acrylic Red Paint', 5, 10, 25.99, 'paint', 'available'),
  ('paint', 'Oil Blue Paint', 15, 8, 35.50, 'paint', 'available'),
  ('painting', 'Sunset Landscape', 1, 1, 299.99, 'painting', 'available'),
  ('paint', 'Watercolor Yellow', 3, 12, 18.75, 'paint', 'available')
ON CONFLICT DO NOTHING;

-- 7. Check clients table
SELECT COUNT(*) as total_clients FROM clients;

-- 8. Check clients table structure first
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8b. Insert sample client if table is empty (SKIP THIS FOR NOW - we need to see the actual column names first)
-- INSERT INTO clients (
--   first_name, last_name, email, phone, total_spent
-- ) VALUES 
--   ('John', 'Doe', 'john.doe@example.com', '+1-555-0123', 150.00),
--   ('Jane', 'Smith', 'jane.smith@example.com', '+1-555-0456', 75.50)
-- ON CONFLICT (email) DO NOTHING;

-- 9. Insert sample order if orders table is empty (SKIP THIS FOR NOW)
-- INSERT INTO orders (
--   order_number, client_id, status, total, payment_status
-- ) 
-- SELECT 
--   'ORD-001',
--   c.id,
--   'draft',
--   125.99,
--   'pending'
-- FROM clients c 
-- WHERE c.email = 'john.doe@example.com'
-- LIMIT 1
-- ON CONFLICT (order_number) DO NOTHING;