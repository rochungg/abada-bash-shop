-- Remove the old unique constraint on (day, gender)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_day_gender_key;

-- Ensure the correct constraint (batch_id, day, gender) exists
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_batch_day_gender_unique;
ALTER TABLE public.products ADD CONSTRAINT products_batch_day_gender_unique UNIQUE (batch_id, day, gender);