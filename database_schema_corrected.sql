-- First, let's check if you have a products table or if we need to create one
-- Based on your screenshot, you have a "projects" table, not "products"

-- If you want to use the existing "projects" table for products, we can rename it or create a proper products table
-- Let's create a products table with the proper structure:

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  brand VARCHAR(100),
  name VARCHAR(255),
  size VARCHAR(100),
  color VARCHAR(50),
  unit_price DECIMAL(10,2),
  supplier VARCHAR(255),
  stock_level INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  category VARCHAR(100),
  title VARCHAR(255),
  artist VARCHAR(255),
  medium VARCHAR(100),
  price DECIMAL(10,2),
  gallery_location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'available',
  date_created DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create clients table
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

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
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

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  type VARCHAR(50) NOT NULL, -- stock_in, stock_out, adjustment
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50), -- sale, purchase, return, adjustment
  reference_id UUID, -- order_id, supplier_id, etc.
  product_name VARCHAR(255),
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_level);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);