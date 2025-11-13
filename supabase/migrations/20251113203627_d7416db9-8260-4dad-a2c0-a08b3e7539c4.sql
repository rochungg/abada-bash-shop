-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Create policies for batches
CREATE POLICY "Anyone can view active batches" 
ON public.batches 
FOR SELECT 
USING (active = true);

CREATE POLICY "Authenticated users can manage batches" 
ON public.batches 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add custom name field and batch_id to products
ALTER TABLE public.products 
ADD COLUMN name TEXT,
ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_products_batch_id ON public.products(batch_id);