-- Create storage bucket for batch thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('batch-thumbnails', 'batch-thumbnails', true);

-- Create storage policies for batch thumbnails
CREATE POLICY "Batch thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'batch-thumbnails');

CREATE POLICY "Admins can upload batch thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'batch-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update batch thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'batch-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete batch thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'batch-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));