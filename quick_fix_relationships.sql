-- Quick fix for the relationship error
-- Run these commands in your Supabase SQL Editor

-- 1. First, let's add the missing foreign key constraints
ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS fk_inventory_transactions_product_id;

ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 2. Add foreign key for orders -> clients if missing
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS fk_orders_client_id;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Check if the constraints were added successfully
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;