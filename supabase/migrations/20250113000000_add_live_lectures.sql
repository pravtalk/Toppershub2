-- Create live_lectures table for admin-managed live sessions
CREATE TABLE public.live_lectures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  live_url TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 90,
  is_live BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_lectures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_lectures
CREATE POLICY "Live lectures are viewable by everyone" 
ON public.live_lectures 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all live lectures" 
ON public.live_lectures 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_live_lectures_updated_at
BEFORE UPDATE ON public.live_lectures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();