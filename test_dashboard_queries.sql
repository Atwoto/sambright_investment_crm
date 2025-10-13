-- Test the exact queries the dashboard uses to isolate the issue

-- 1. Test products query (this should work)
SELECT COUNT(*) as total_products FROM products;

-- 2. Test clients query (this should work)  
SELECT COUNT(*) as total_clients FROM clients;

-- 3. Test orders query (this should work)
SELECT COUNT(*) as total_orders FROM orders;

-- 4. Test low stock query (the one we fixed)
SELECT 
  COUNT(*) as low_stock_count
FROM products 
WHERE stock_level < min_stock_level;

-- 5. Test pending orders query
SELECT 
  COUNT(*) as pending_orders
FROM orders 
WHERE payment_status = 'pending' 
   OR status IN ('draft', 'sent');

-- 6. Test inventory_transactions query (this might be causing the issue)
SELECT COUNT(*) as total_transactions FROM inventory_transactions;

-- 7. Test if there are any records in inventory_transactions
SELECT * FROM inventory_transactions LIMIT 3;