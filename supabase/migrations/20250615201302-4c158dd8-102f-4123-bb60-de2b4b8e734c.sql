
-- Add scheduling and media columns to posts table
ALTER TABLE public.posts 
ADD COLUMN scheduled_date DATE,
ADD COLUMN scheduled_time TIME,
ADD COLUMN media_url TEXT;

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Create storage policies for media bucket
CREATE POLICY "Users can upload their own media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media" ON storage.objects
FOR SELECT USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
