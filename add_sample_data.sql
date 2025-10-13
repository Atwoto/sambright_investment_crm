-- Add more sample data if needed (using correct column names)

-- Add more products with different stock levels for testing
INSERT INTO products (
  product_type, name, stock_level, min_stock_level, 
  unit_price, category, status, brand
) VALUES 
  ('paint', 'Premium Acrylic Red', 3, 10, 25.99, 'acrylic', 'available', 'ArtMaster'),
  ('paint', 'Oil Blue Professional', 15, 8, 35.50, 'oil', 'available', 'ProPaint'),
  ('painting', 'Mountain Sunset', 1, 1, 299.99, 'landscape', 'available', NULL),
  ('paint', 'Watercolor Yellow Bright', 2, 12, 18.75, 'watercolor', 'available', 'ColorFlow'),
  ('paint', 'Acrylic White Base', 25, 15, 22.00, 'acrylic', 'available', 'ArtMaster')
ON CONFLICT DO NOTHING;

-- Add more clients (using correct column names: name, company, email, phone)
INSERT INTO clients (
  name, company, email, phone, address, city, state, client_type
) VALUES 
  ('John Smith', 'Smith Art Gallery', 'john@smithgallery.com', '+1-555-0123', '123 Art St', 'New York', 'NY', 'gallery'),
  ('Sarah Johnson', 'Independent Artist', 'sarah.j@email.com', '+1-555-0456', '456 Creative Ave', 'Los Angeles', 'CA', 'individual')
ON CONFLICT DO NOTHING;

-- Add more orders for testing
INSERT INTO orders (
  order_number, client_id, status, total, payment_status, order_type
) 
SELECT 
  'ORD-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  c.id,
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 'draft'
    WHEN ROW_NUMBER() OVER() % 3 = 2 THEN 'pending'
    ELSE 'completed'
  END,
  (RANDOM() * 500 + 50)::numeric(10,2),
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 'pending'
    WHEN ROW_NUMBER() OVER() % 3 = 2 THEN 'pending'
    ELSE 'paid'
  END,
  'sale'
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.order_number LIKE 'ORD-%'
);