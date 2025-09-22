-- Comprehensive setup script for inventory management

-- 1. Create products table for both paints and paintings
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(50) NOT NULL, -- 'paint' or 'painting'
  sku VARCHAR(100),
  brand VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  size VARCHAR(100),
  color VARCHAR(50),
  unit_price DECIMAL(10,2),
  supplier VARCHAR(255),
  stock_level INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  category VARCHAR(100),
  title VARCHAR(255), -- for paintings
  artist VARCHAR(255), -- for paintings
  medium VARCHAR(100), -- for paintings
  price DECIMAL(10,2), -- for paintings
  gallery_location VARCHAR(255), -- for paintings
  status VARCHAR(50) DEFAULT 'available', -- for paintings
  date_created DATE, -- for paintings
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Update inventory_transactions table to include all necessary columns
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

-- 3. Add foreign key constraints (only if the referenced tables exist and have compatible structures)
-- Uncomment these lines after confirming your tables structure:
-- ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_level);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);