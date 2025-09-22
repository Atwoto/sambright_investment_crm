-- First, let's create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  total_spent DECIMAL(10,2) DEFAULT 0,
  purchase_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  recent_transactions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table (without foreign key constraint for now)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID,
  order_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  total DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  shipping_address TEXT,
  billing_address TEXT,
  notes TEXT,
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory_transactions table (without foreign key constraint for now)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID,
  type VARCHAR(50) NOT NULL, -- stock_in, stock_out, adjustment
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50), -- sale, purchase, return, adjustment
  reference_id UUID, -- order_id, supplier_id, etc.
  product_name VARCHAR(255),
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints only if the referenced tables exist and have compatible structures
-- You can run these commands separately after confirming your products table structure:
-- ALTER TABLE orders ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
-- ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);