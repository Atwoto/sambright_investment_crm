-- Create storage bucket for project images
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow public read access to project images
CREATE POLICY "Allow public read access to project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

-- Allow authenticated users to delete project images
CREATE POLICY "Allow authenticated users to delete project images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');
