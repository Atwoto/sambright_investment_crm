# Image Upload Setup for Projects

## What Was Implemented

### 1. ✅ Direct Image Upload from Local Machine

- Users can now select multiple images from their computer
- Images are uploaded directly to Supabase Storage
- Shows file count and total size before upload
- Supports all image formats (jpg, png, gif, etc.)

### 2. ✅ Video Links (YouTube)

- Video Link field for YouTube/Vimeo links
- No upload needed - just paste the link
- Keeps videos lightweight

## Setup Steps

### Step 1: Create Storage Bucket in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `setup_storage_bucket.sql`
3. This creates:
   - A public bucket called `project-images`
   - Policies for authenticated users to upload/delete
   - Public read access for everyone

### Step 2: Verify Bucket Creation

1. Go to Supabase Dashboard → Storage
2. You should see `project-images` bucket
3. Click on it to verify it's public

### Step 3: Deploy Code

Push your code to Vercel - it will deploy automatically

## How It Works

### For Users:

1. Click "Add Project"
2. Fill in project details
3. Click "Choose Files" under Images
4. Select multiple images from computer (Ctrl+Click or Cmd+Click)
5. See file count and size
6. Paste YouTube link in Video Link field
7. Click "Create Project"

### Behind the Scenes:

1. Images are uploaded to Supabase Storage bucket
2. Each image gets a unique filename
3. Public URLs are generated
4. URLs are saved in database as array
5. Video link saved as string

## File Size Limits

- **Per Image**: Up to 10MB recommended
- **Total**: No hard limit, but keep reasonable
- **Formats**: JPG, PNG, GIF, WebP, etc.

## Storage Structure

```
project-images/
├── abc123-1234567890.jpg
├── def456-1234567891.png
└── ghi789-1234567892.jpg
```

Each file gets a random name to avoid conflicts.

## Database Schema

```sql
images TEXT[]        -- Array of image URLs from Supabase Storage
video_link VARCHAR   -- YouTube/Vimeo link
```

## Benefits

✅ **Direct Upload** - No need for external image hosting
✅ **Multiple Images** - Upload many photos at once
✅ **Automatic URLs** - Public URLs generated automatically
✅ **Secure** - Only authenticated users can upload
✅ **Public Access** - Anyone can view the images
✅ **Lightweight Videos** - Just links, no storage used

## Next Steps

1. Run `setup_storage_bucket.sql` in Supabase
2. Run `update_projects_table.sql` to add columns
3. Deploy to Vercel
4. Test uploading images!

## Troubleshooting

**If upload fails:**

- Check if bucket exists in Supabase Storage
- Verify policies are set correctly
- Check file size (keep under 10MB per image)
- Ensure user is authenticated

**If images don't show:**

- Verify bucket is set to public
- Check browser console for errors
- Verify URLs are saved in database
