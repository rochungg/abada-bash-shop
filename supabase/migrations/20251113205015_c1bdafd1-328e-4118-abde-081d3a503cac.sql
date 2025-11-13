-- Create function to ensure only one active batch
CREATE OR REPLACE FUNCTION public.ensure_single_active_batch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = true THEN
    -- Deactivate all other batches
    UPDATE public.batches 
    SET active = false 
    WHERE id != NEW.id AND active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS ensure_single_active_batch_trigger ON public.batches;

-- Create trigger
CREATE TRIGGER ensure_single_active_batch_trigger
  BEFORE INSERT OR UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_batch();