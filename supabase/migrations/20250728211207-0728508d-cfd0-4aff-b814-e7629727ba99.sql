-- Create policies for the media storage bucket to allow users to upload avatars

-- Policy for users to upload their own avatar files
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy for users to view their own avatar files
CREATE POLICY "Users can view their own avatar" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy for users to update their own avatar files
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy for users to delete their own avatar files
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy for public access to view avatar images (since they should be publicly accessible)
CREATE POLICY "Anyone can view avatar images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[2] = 'avatars'
);