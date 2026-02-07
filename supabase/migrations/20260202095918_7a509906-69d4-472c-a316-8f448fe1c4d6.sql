-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create brands table
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Anyone can read categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for brands
CREATE POLICY "Anyone can read brands" 
ON public.brands 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage brands" 
ON public.brands 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (slug, name, icon) VALUES
('pcs', 'Gaming PCs', 'Monitor'),
('monitors', 'Monitors', 'MonitorUp'),
('peripherals', 'Peripherals', 'Keyboard'),
('audio', 'Audio', 'Headphones'),
('furniture', 'Furniture', 'Armchair'),
('accessories', 'Accessories', 'Sparkles');

-- Insert default brands
INSERT INTO public.brands (slug, name) VALUES
('nexusforge', 'NexusForge'),
('visionmax', 'VisionMax'),
('keymaster', 'KeyMaster'),
('swiftgear', 'SwiftGear'),
('audioelite', 'AudioElite'),
('ergothrone', 'ErgoThrone');