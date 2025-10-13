-- Clean up orphaned data before adding foreign key constraints

-- 1. First, let's see what orphaned records we have
SELECT 
  it.id,
  it.product_id,
  it.product_name,
  it.type,
  it.created_at
FROM inventory_transactions it
LEFT JOIN products p ON it.product_id = p.id
WHERE p.id IS NULL;

-- 2. Count how many orphaned records exist
SELECT COUNT(*) as orphaned_inventory_transactions
FROM inventory_transactions it
LEFT JOIN products p ON it.product_id = p.id
WHERE p.id IS NULL;

-- 3. Option A: Delete orphaned inventory transactions
-- DELETE FROM inventory_transactions 
-- WHERE product_id NOT IN (SELECT id FROM products WHERE id IS NOT NULL);

-- 4. Option B: Set orphaned product_id to NULL (safer option)
UPDATE inventory_transactions 
SET product_id = NULL 
WHERE product_id NOT IN (SELECT id FROM products WHERE id IS NOT NULL);

-- 5. Also check for orphaned client_id references
SELECT COUNT(*) as orphaned_client_references
FROM inventory_transactions it
LEFT JOIN clients c ON it.client_id = c.id
WHERE it.client_id IS NOT NULL AND c.id IS NULL;

-- 6. Clean up orphaned client references too
UPDATE inventory_transactions 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
  AND client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);

-- 7. Now we can safely add the foreign key constraints
ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS fk_inventory_transactions_product_id;

ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 8. Add client foreign key constraint
ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS fk_inventory_transactions_client_id;

ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 9. Add orders -> clients foreign key if needed
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS fk_orders_client_id;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 10. Verify the constraints were added
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('inventory_transactions', 'orders')
ORDER BY tc.table_name;