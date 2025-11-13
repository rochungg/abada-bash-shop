-- Create products table for abadás
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 6),
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  stock INTEGER NOT NULL DEFAULT 0,
  price_bracket_1 DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_bracket_2 DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_bracket_3 DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_bracket_4 DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_bracket_5 DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_bracket_6 DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day, gender)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view products (public)
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only authenticated users can insert/update products (admin)
CREATE POLICY "Authenticated users can manage products"
ON public.products
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create orders
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view all orders (admin)
CREATE POLICY "Authenticated users can view orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();