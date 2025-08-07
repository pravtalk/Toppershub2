-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lectures table
CREATE TABLE public.lectures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_batches table for enrollment
CREATE TABLE public.user_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, batch_id)
);

-- Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batches
CREATE POLICY "Batches are viewable by everyone" 
ON public.batches 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all batches" 
ON public.batches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "Subjects are viewable by everyone" 
ON public.subjects 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all subjects" 
ON public.subjects 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lectures
CREATE POLICY "Lectures are viewable by everyone" 
ON public.lectures 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all lectures" 
ON public.lectures 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_batches
CREATE POLICY "Users can view their own enrollments" 
ON public.user_batches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" 
ON public.user_batches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all enrollments" 
ON public.user_batches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at
BEFORE UPDATE ON public.lectures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();