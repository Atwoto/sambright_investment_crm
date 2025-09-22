-- Create products table for both paints and paintings
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_level);