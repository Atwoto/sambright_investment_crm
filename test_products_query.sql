-- Test the exact query the app uses for low stock items
SELECT 
  id,
  name,
  stock_level,
  min_stock_level,
  (stock_level < min_stock_level) as is_low_stock,
  product_type,
  status
FROM products 
ORDER BY stock_level;

-- Count low stock items (this is what the dashboard shows)
SELECT 
  COUNT(*) as low_stock_count
FROM products 
WHERE stock_level < min_stock_level;

-- Test the orders query for pending orders
SELECT 
  id,
  order_number,
  status,
  payment_status,
  total
FROM orders
WHERE payment_status = 'pending' 
   OR status IN ('draft', 'sent');