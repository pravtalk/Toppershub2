-- Create books table for book-based batches
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add batch_type column to batches table to distinguish between lecture-based and book-based batches
ALTER TABLE public.batches 
ADD COLUMN batch_type TEXT DEFAULT 'lecture' CHECK (batch_type IN ('lecture', 'book'));

-- Enable Row Level Security on books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policies for books table
CREATE POLICY "Admin can manage all books" 
ON public.books 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Books are viewable by everyone" 
ON public.books 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pdfs', 'book-pdfs', true);

-- Create policies for PDF storage
CREATE POLICY "PDF files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'book-pdfs');

CREATE POLICY "Admin can upload PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'book-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'book-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'book-pdfs' AND has_role(auth.uid(), 'admin'::app_role));