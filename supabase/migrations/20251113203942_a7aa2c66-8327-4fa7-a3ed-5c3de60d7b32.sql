-- Add unique constraint to prevent duplicate products in the same batch
ALTER TABLE public.products 
ADD CONSTRAINT products_batch_day_gender_unique 
UNIQUE (batch_id, day, gender);