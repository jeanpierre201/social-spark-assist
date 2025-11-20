-- Create ai-images storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-images',
  'ai-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own AI images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own AI images
CREATE POLICY "Users can view their own AI images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ai-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to AI images (since bucket is public)
CREATE POLICY "Public can view AI images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-images');

-- Allow authenticated users to update their own AI images
CREATE POLICY "Users can update their own AI images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ai-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own AI images
CREATE POLICY "Users can delete their own AI images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);