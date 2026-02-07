-- Create products table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pcs', 'monitors', 'peripherals', 'furniture', 'audio', 'accessories')),
  brand TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  has_rgb BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  specs JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read products
CREATE POLICY "Anyone can read products"
ON public.products
FOR SELECT
USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial products from the existing data
INSERT INTO public.products (id, name, description, price, original_price, image, category, brand, rating, reviews, in_stock, has_rgb, featured, specs, tags) VALUES
('pc-1', 'Phantom X Gaming PC', 'Ultimate gaming powerhouse with RTX 4090 and Intel i9-14900K. Experience unparalleled performance for 4K gaming and content creation.', 3999, 4499, '/product-gaming-pc.jpg', 'pcs', 'NexusForge', 4.9, 847, true, true, true, '{"GPU": "NVIDIA RTX 4090 24GB", "CPU": "Intel Core i9-14900K", "RAM": "64GB DDR5 6000MHz", "Storage": "2TB NVMe Gen5 SSD", "Cooling": "360mm AIO Liquid Cooler", "PSU": "1000W 80+ Platinum"}', ARRAY['4K Gaming', 'VR Ready', 'Streaming']),
('pc-2', 'Stealth Pro Gaming PC', 'High-performance gaming system with RTX 4080 Super. Perfect balance of power and value for competitive gaming.', 2499, NULL, '/product-gaming-pc.jpg', 'pcs', 'NexusForge', 4.8, 523, true, true, false, '{"GPU": "NVIDIA RTX 4080 Super 16GB", "CPU": "AMD Ryzen 9 7950X3D", "RAM": "32GB DDR5 5600MHz", "Storage": "1TB NVMe Gen4 SSD", "Cooling": "280mm AIO Liquid Cooler", "PSU": "850W 80+ Gold"}', ARRAY['Esports Ready', '1440p Gaming']),
('pc-3', 'Vortex Entry Gaming PC', 'Budget-friendly gaming PC that doesn''t compromise on quality. Great for 1080p gaming and everyday tasks.', 1299, NULL, '/product-gaming-pc.jpg', 'pcs', 'NexusForge', 4.6, 1243, true, true, false, '{"GPU": "NVIDIA RTX 4060 Ti 8GB", "CPU": "Intel Core i5-14600K", "RAM": "16GB DDR5 5200MHz", "Storage": "500GB NVMe SSD", "Cooling": "Tower Air Cooler", "PSU": "650W 80+ Bronze"}', ARRAY['Budget Friendly', '1080p Gaming']),
('monitor-1', 'UltraView 34" Curved OLED', 'Immersive 34-inch curved OLED gaming monitor with 240Hz refresh rate and 0.1ms response time. HDR 1000 certified.', 1299, 1499, '/product-monitor.jpg', 'monitors', 'VisionMax', 4.9, 634, true, true, true, '{"Panel": "QD-OLED", "Resolution": "3440 x 1440", "Refresh Rate": "240Hz", "Response Time": "0.1ms GTG", "HDR": "HDR 1000", "Curve": "1800R"}', ARRAY['OLED', 'Curved', 'HDR']),
('monitor-2', 'ProGamer 27" IPS', 'Professional esports monitor with 360Hz refresh rate. G-Sync Ultimate certified for tear-free competitive gaming.', 799, NULL, '/product-monitor.jpg', 'monitors', 'VisionMax', 4.7, 892, true, false, false, '{"Panel": "Fast IPS", "Resolution": "1920 x 1080", "Refresh Rate": "360Hz", "Response Time": "1ms GTG", "Sync": "G-Sync Ultimate", "Stand": "Height Adjustable"}', ARRAY['Esports', '360Hz', 'G-Sync']),
('keyboard-1', 'Apex Pro Mechanical Keyboard', 'Premium optical-mechanical keyboard with adjustable actuation. Per-key RGB lighting and aluminum frame.', 229, 269, '/product-keyboard.jpg', 'peripherals', 'KeyMaster', 4.8, 2341, true, true, true, '{"Switches": "Optical-Mechanical", "Layout": "Full Size", "Actuation": "Adjustable 0.2-3.8mm", "Backlight": "Per-Key RGB", "Frame": "Aircraft-Grade Aluminum", "Connectivity": "USB-C / Wireless"}', ARRAY['Optical', 'Hot-Swappable', 'Wireless']),
('keyboard-2', 'Phantom TKL Wireless', 'Tenkeyless wireless mechanical keyboard with low-latency 2.4GHz connection. 80-hour battery life.', 159, NULL, '/product-keyboard.jpg', 'peripherals', 'KeyMaster', 4.6, 1567, true, true, false, '{"Switches": "Gateron Pro Red", "Layout": "TKL (87 Keys)", "Battery": "80 Hours", "Backlight": "RGB", "Connection": "2.4GHz / Bluetooth / USB-C", "Hot-Swap": "Yes"}', ARRAY['TKL', 'Wireless', 'Hot-Swappable']),
('mouse-1', 'Viper Ultra Wireless Mouse', 'Ultra-lightweight wireless gaming mouse at just 49g. Focus Pro 30K optical sensor with 750 IPS tracking.', 149, NULL, '/product-mouse.jpg', 'peripherals', 'SwiftGear', 4.9, 3421, true, true, true, '{"Weight": "49g", "Sensor": "Focus Pro 30K", "DPI": "30,000", "Polling Rate": "4000Hz", "Battery": "90 Hours", "Switches": "Optical Gen-3"}', ARRAY['Ultra-Light', 'Wireless', 'Esports']),
('mouse-2', 'Titan Ergo Gaming Mouse', 'Ergonomic gaming mouse with thumb rest. 11 programmable buttons for MMO and MOBA gaming.', 89, NULL, '/product-mouse.jpg', 'peripherals', 'SwiftGear', 4.5, 1876, true, true, false, '{"Weight": "95g", "Sensor": "PMW3370", "DPI": "19,000", "Buttons": "11 Programmable", "Connection": "Wired USB", "Cable": "Paracord Flexible"}', ARRAY['Ergonomic', 'MMO', 'Programmable']),
('headset-1', 'Nova Pro Wireless Headset', 'Premium wireless gaming headset with active noise cancellation. Hi-Res Audio certified with 360° spatial audio.', 349, 399, '/product-headset.jpg', 'audio', 'AudioElite', 4.8, 1234, true, true, true, '{"Drivers": "40mm Planar Magnetic", "Frequency": "10Hz - 40kHz", "ANC": "Adaptive Active", "Battery": "44 Hours", "Microphone": "AI-Noise Cancelling", "Audio": "360° Spatial Sound"}', ARRAY['ANC', 'Hi-Res', 'Wireless']),
('headset-2', 'Cloud Burst Gaming Headset', 'Lightweight wired gaming headset with exceptional comfort. DTS Headphone:X 7.1 surround sound.', 99, NULL, '/product-headset.jpg', 'audio', 'AudioElite', 4.6, 2876, true, false, false, '{"Drivers": "53mm Dynamic", "Frequency": "20Hz - 20kHz", "Surround": "DTS Headphone:X 7.1", "Weight": "280g", "Microphone": "Detachable Boom", "Pads": "Memory Foam"}', ARRAY['Lightweight', '7.1 Surround', 'Comfort']),
('chair-1', 'Titan Evo Gaming Chair', 'Premium ergonomic gaming chair with 4-way lumbar support. Magnetic memory foam head pillow and armrests.', 549, 649, '/product-chair.jpg', 'furniture', 'ErgoThrone', 4.9, 4521, true, false, true, '{"Material": "NEO Hybrid Leatherette", "Lumbar": "4-Way Adjustable", "Recline": "85° - 165°", "Armrests": "4D CloudSwap", "Max Weight": "395 lbs", "Height Range": "5''6\" - 6''2\""}', ARRAY['Ergonomic', 'Lumbar Support', 'Premium']),
('chair-2', 'Omega Fabric Gaming Chair', 'Breathable fabric gaming chair for extended sessions. Cold-cure foam with premium build quality.', 399, NULL, '/product-chair.jpg', 'furniture', 'ErgoThrone', 4.7, 2143, true, false, false, '{"Material": "SoftWeave Fabric", "Lumbar": "External Pillow", "Recline": "90° - 160°", "Armrests": "3D Adjustable", "Max Weight": "330 lbs", "Height Range": "5''4\" - 5''11\""}', ARRAY['Fabric', 'Breathable', 'Comfort']);