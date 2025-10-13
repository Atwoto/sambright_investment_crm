-- Test your actual order data structure to understand what we're working with

-- 1. Check what's actually in your orders.items JSONB field
SELECT 
  id,
  order_number,
  total,
  items,
  status,
  payment_status,
  created_at
FROM orders 
LIMIT 3;

-- 2. Check if you have client_type field for proper segmentation
SELECT 
  id,
  name,
  company,
  client_type,
  email
FROM clients
LIMIT 5;

-- 3. Test revenue calculation - what should the total revenue actually be?
SELECT 
  SUM(total) as actual_total_revenue,
  COUNT(*) as total_orders,
  AVG(total) as actual_average_order_value,
  COUNT(CASE WHEN status = 'completed' OR payment_status = 'paid' THEN 1 END) as completed_orders
FROM orders
WHERE total IS NOT NULL;

-- 4. Check what product types you actually have
SELECT 
  product_type,
  COUNT(*) as count,
  SUM(stock_level) as total_stock
FROM products
GROUP BY product_type;

-- 5. Sample query to see if we can extract items from JSONB properly
SELECT 
  order_number,
  jsonb_array_length(items) as item_count,
  items
FROM orders 
WHERE items IS NOT NULL
LIMIT 2;