-- Update inventory_transactions table to include all necessary columns
ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);