-- Run this in your Supabase SQL editor to set up storage for content files

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-files', 'content-files', false);

-- Create storage policies
CREATE POLICY "Admin can upload content files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND exists(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can update content files" ON storage.objects  
FOR UPDATE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND exists(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can delete content files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND exists(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view content files" ON storage.objects
FOR SELECT USING (bucket_id = 'content-files');