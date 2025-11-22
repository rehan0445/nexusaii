-- Fix Supabase Storage Policies for Public Image Access
-- Run this in Supabase SQL Editor

-- Enable RLS (Row Level Security) on storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access for nexus-profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for nexus-character-image" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for nexus-announcements" ON storage.objects;

DROP POLICY IF EXISTS "Allow upload to nexus-profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to nexus-character-image" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to nexus-announcements" ON storage.objects;

-- Create public read access policies for all buckets
CREATE POLICY "Public Access for nexus-profile-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'nexus-profile-images');

CREATE POLICY "Public Access for nexus-character-image"
ON storage.objects FOR SELECT
USING (bucket_id = 'nexus-character-image');

CREATE POLICY "Public Access for nexus-announcements"
ON storage.objects FOR SELECT
USING (bucket_id = 'nexus-announcements');

-- Create upload policies (authenticated users can upload)
CREATE POLICY "Allow upload to nexus-profile-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nexus-profile-images');

CREATE POLICY "Allow upload to nexus-character-image"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nexus-character-image');

CREATE POLICY "Allow upload to nexus-announcements"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nexus-announcements');

-- Create update/delete policies
CREATE POLICY "Allow update to nexus-profile-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nexus-profile-images');

CREATE POLICY "Allow update to nexus-character-image"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nexus-character-image');

CREATE POLICY "Allow update to nexus-announcements"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nexus-announcements');

-- Allow delete
CREATE POLICY "Allow delete from nexus-profile-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'nexus-profile-images');

CREATE POLICY "Allow delete from nexus-character-image"
ON storage.objects FOR DELETE
USING (bucket_id = 'nexus-character-image');

CREATE POLICY "Allow delete from nexus-announcements"
ON storage.objects FOR DELETE
USING (bucket_id = 'nexus-announcements');

SELECT 'Storage policies updated! Images should now be visible.' AS status;

