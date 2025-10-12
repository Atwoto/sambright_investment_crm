-- Update projects table structure for painting business CRM

-- Drop existing table if you want to start fresh (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS projects CASCADE;

-- Create or update projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT,
  project_type VARCHAR(50) DEFAULT 'painting', -- 'painting', 'renovation', 'consultation', etc.
  status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'in_progress', 'completed', 'on_hold', 'cancelled'
  start_date DATE,
  end_date DATE,
  estimated_budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2) DEFAULT 0,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'painting',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planning',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS estimated_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at_trigger ON projects;
CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Sample data (optional - remove if you don't want sample data)
-- INSERT INTO projects (project_number, name, client_id, description, project_type, status, start_date, estimated_budget, location)
-- SELECT 
--   'PRJ-2025-001',
--   'Office Interior Painting',
--   id,
--   'Complete interior painting of office space',
--   'painting',
--   'in_progress',
--   CURRENT_DATE,
--   150000.00,
--   'Nairobi CBD'
-- FROM clients LIMIT 1;
