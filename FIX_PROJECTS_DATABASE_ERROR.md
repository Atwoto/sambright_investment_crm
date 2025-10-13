# Fix Projects Database Error

## The Error

You're seeing: `null value in column "projects" violates not-null constraint`

This error is confusing because there's no column called "projects" in the insert statement. This usually means one of two things:

1. The projects table doesn't exist or has a different structure
2. There's a constraint or trigger that's causing the issue

## Solution Steps

### Step 1: Check if Projects Table Exists

Run this in Supabase SQL Editor:

```sql
-- Check if projects table exists and see its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

### Step 2: Create/Update Projects Table

If the table doesn't exist or has wrong structure, run this:

```sql
-- Drop existing table if needed (WARNING: This deletes all project data!)
-- Only uncomment if you want to start fresh
-- DROP TABLE IF EXISTS projects CASCADE;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT,
  project_type VARCHAR(50) DEFAULT 'painting',
  status VARCHAR(50) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  estimated_budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2) DEFAULT 0,
  location VARCHAR(255),
  notes TEXT,
  images TEXT[],
  video_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

-- Add trigger for updated_at
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
```

### Step 3: Enable Row Level Security (RLS)

If you have RLS enabled on your Supabase project, you need policies:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Enable all for authenticated users" ON projects
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Or allow public access (less secure, but simpler for testing)
CREATE POLICY "Enable all for everyone" ON projects
  FOR ALL
  USING (true);
```

### Step 4: Test the Fix

1. Restart your dev server (Ctrl+C, then `npm run dev`)
2. Try creating a project again
3. Check the browser console (F12) for the detailed error message
4. The error will now show the actual problem

## Common Issues & Solutions

### Issue 1: "relation 'projects' does not exist"

**Solution:** Run Step 2 above to create the table

### Issue 2: "permission denied for table projects"

**Solution:** Run Step 3 to add RLS policies

### Issue 3: "null value in column X violates not-null constraint"

**Solution:** The column X is required but not being provided. Check which column and either:

- Provide a value in the code
- Make the column nullable: `ALTER TABLE projects ALTER COLUMN X DROP NOT NULL;`

### Issue 4: "foreign key constraint violation"

**Solution:** The client_id doesn't exist in the clients table. Make sure:

- You're selecting a valid client from the dropdown
- The clients table has data
- The client_id is being passed correctly

## Debugging Steps

1. **Check what data is being sent:**

   - Open browser console (F12)
   - Try creating a project
   - Look for the log: "Inserting project data: {...}"
   - Verify all required fields are present

2. **Check the actual error:**

   - Look for "Supabase error details:" in console
   - This will show the exact column and constraint that's failing

3. **Verify table structure:**
   - Run the query from Step 1
   - Compare with the expected structure
   - Look for any columns with is_nullable = 'NO' that might be missing defaults

## Quick Test Query

After running the migrations, test if you can insert manually:

```sql
-- Test insert (replace 'your-client-id' with an actual client ID)
INSERT INTO projects (
  project_number,
  name,
  client_id,
  project_type,
  status
) VALUES (
  'PRJ-TEST-001',
  'Test Project',
  'your-client-id-here',
  'painting',
  'planning'
);

-- If successful, delete the test
DELETE FROM projects WHERE project_number = 'PRJ-TEST-001';
```

## What I Changed in the Code

I updated the error handling in `ProjectsManager.tsx` to:

1. Log the exact data being inserted
2. Show the full error message including hints
3. Display errors for 6 seconds so you can read them

Now when you try to create a project, you'll see:

- What data is being sent (in console)
- The exact database error message (in toast and console)

## Next Steps

1. Run the SQL migrations above
2. Try creating a project
3. If it still fails, share with me:
   - The "Inserting project data:" log from console
   - The "Supabase error details:" log from console
   - I'll help you fix the specific issue
