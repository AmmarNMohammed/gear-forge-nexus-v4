-- Create setups table
CREATE TABLE public.setups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  style TEXT NOT NULL DEFAULT 'minimal',
  is_curated BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  products JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.setups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read setups"
ON public.setups
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage setups"
ON public.setups
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_setups_updated_at
BEFORE UPDATE ON public.setups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();