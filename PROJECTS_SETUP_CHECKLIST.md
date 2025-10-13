# Projects Setup Checklist

## Quick Fix Steps

Follow these steps in order to fix the projects database error:

### ✅ Step 1: Create Projects Table

Go to Supabase SQL Editor and run:

```sql
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
```

### ✅ Step 2: Add RLS Policies

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow all operations (you can make this more restrictive later)
CREATE POLICY "Enable all for authenticated users" ON projects
  FOR ALL
  USING (true);
```

### ✅ Step 3: Create Storage Bucket for Images

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow uploads
CREATE POLICY "Allow authenticated users to upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow public read
CREATE POLICY "Allow public read access to project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Allow delete
CREATE POLICY "Allow authenticated users to delete project images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');
```

### ✅ Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### ✅ Step 5: Test

1. Open your app
2. Go to Projects tab
3. Click "Add Project"
4. Fill in:
   - Select a client
   - Enter project name
   - (Optional) Add other details
5. Click "Create Project"

## Expected Results

After completing these steps:

- ✅ Projects save to database
- ✅ Projects persist after page refresh
- ✅ You see "Project created successfully" message
- ✅ Images can be uploaded (optional)
- ✅ Projects appear in the list

## Troubleshooting

### If you still see an error:

1. **Open browser console (F12)**
2. **Try creating a project**
3. **Look for these logs:**

   - "Inserting project data: {...}" - shows what's being sent
   - "Supabase error details: {...}" - shows the exact error

4. **Common errors and fixes:**

#### "relation 'projects' does not exist"

- You didn't run Step 1
- Run the CREATE TABLE query

#### "permission denied for table projects"

- You didn't run Step 2
- Run the RLS policies

#### "foreign key constraint violation"

- The client you selected doesn't exist
- Make sure you have clients in your database
- Try creating a client first

#### "null value in column X violates not-null constraint"

- A required field is missing
- Check which column X is
- Either provide a value or make it nullable

#### "bucket 'project-images' does not exist"

- You didn't run Step 3
- Run the storage bucket setup
- Or don't upload images for now

### Still not working?

Share with me:

1. The "Inserting project data:" log from console
2. The "Supabase error details:" log from console
3. Screenshot of the error

I'll help you fix it!

## What's Different from Orders?

Projects have some extra features:

- **Image uploads** - Store project photos in Supabase Storage
- **Video links** - Link to YouTube or other videos
- **Date ranges** - Track start and end dates
- **Budget tracking** - Estimated vs actual costs
- **Location** - Where the project is happening

All of these are optional except:

- Client (required)
- Project Name (required)

## Files You Can Reference

- `update_projects_table.sql` - Full table schema
- `setup_storage_bucket.sql` - Storage bucket setup
- `FIX_PROJECTS_DATABASE_ERROR.md` - Detailed troubleshooting guide
