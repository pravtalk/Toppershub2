-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-files', 'content-files', true);

-- Create storage policies for content files
CREATE POLICY "Admin can upload content files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update content files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete content files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view content files" ON storage.objects
FOR SELECT USING (bucket_id = 'content-files');