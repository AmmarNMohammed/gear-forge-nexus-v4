-- Create discount_type enum
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  times_used integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create product_inventory table
CREATE TABLE public.product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  track_inventory boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

-- Coupons RLS: Public can read active coupons for validation
CREATE POLICY "Anyone can read active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true);

-- Coupons RLS: Only admins can manage coupons
CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inventory RLS: Anyone can read inventory for stock display
CREATE POLICY "Anyone can read inventory"
ON public.product_inventory
FOR SELECT
USING (true);

-- Inventory RLS: Only admins can manage inventory
CREATE POLICY "Admins can manage inventory"
ON public.product_inventory
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at on inventory changes
CREATE TRIGGER update_product_inventory_updated_at
BEFORE UPDATE ON public.product_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial inventory for all products (default 50 stock each)
INSERT INTO public.product_inventory (product_id, stock_quantity, low_stock_threshold)
VALUES 
  ('hyperx-cloud-iii', 50, 5),
  ('logitech-g502-x-plus', 50, 5),
  ('razer-huntsman-v3', 50, 5),
  ('lg-27gp950-b', 50, 5),
  ('secretlab-titan-evo', 50, 5),
  ('custom-gaming-pc', 10, 2)
ON CONFLICT (product_id) DO NOTHING;

-- Create a sample coupon for testing
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active)
VALUES ('WELCOME10', 'percentage', 10, 50, true)
ON CONFLICT (code) DO NOTHING;