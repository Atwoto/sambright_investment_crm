-- Simple table structure check - run this first to see what you actually have

-- 1. List all your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check products table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check clients table structure  
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Count records in each table
SELECT 
  'products' as table_name, 
  COUNT(*) as record_count 
FROM products
UNION ALL
SELECT 
  'clients' as table_name, 
  COUNT(*) as record_count 
FROM clients
UNION ALL
SELECT 
  'orders' as table_name, 
  COUNT(*) as record_count 
FROM orders;