-- Fix foreign key relationships for Supabase

-- Add foreign key constraint for inventory_transactions -> products
ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Add foreign key constraint for inventory_transactions -> clients (if needed)
ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add foreign key constraint for orders -> clients (if not already exists)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Refresh Supabase schema cache (this happens automatically, but you can also do it manually in the Supabase dashboard)
-- Go to Settings > API > Schema Cache and click "Refresh Schema"