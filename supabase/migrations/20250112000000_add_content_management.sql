-- Create content categories enum
CREATE TYPE public.content_type AS ENUM ('notes', 'questions');

-- Create content_uploads table
CREATE TABLE public.content_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type public.content_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  pages_count INTEGER,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_uploads
CREATE POLICY "Content uploads are viewable by everyone" 
ON public.content_uploads 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all content uploads" 
ON public.content_uploads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_content_uploads_updated_at
BEFORE UPDATE ON public.content_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets (these need to be run manually in Supabase dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', false);

-- Create storage policies (uncomment and run manually)
-- CREATE POLICY "Admin can upload content files" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'content-files' AND auth.role() = 'authenticated' AND has_role(auth.uid(), 'admin'));

-- CREATE POLICY "Admin can update content files" ON storage.objects  
-- FOR UPDATE USING (bucket_id = 'content-files' AND auth.role() = 'authenticated' AND has_role(auth.uid(), 'admin'));

-- CREATE POLICY "Admin can delete content files" ON storage.objects
-- FOR DELETE USING (bucket_id = 'content-files' AND auth.role() = 'authenticated' AND has_role(auth.uid(), 'admin'));

-- CREATE POLICY "Anyone can view content files" ON storage.objects
-- FOR SELECT USING (bucket_id = 'content-files');