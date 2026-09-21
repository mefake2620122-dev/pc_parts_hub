-- ==============================================================================
-- PC PART HUB - Complete Supabase PostgreSQL Schema & Seed Data
-- Instructions:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Go to the "SQL Editor" tab on the left sidebar
-- 3. Click "New Query", paste this ENTIRE file, and click "Run" (green button)
-- 4. In your project settings, copy:
--    - Project URL (SUPABASE_URL)
--    - Service Role Key or Anon Key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY)
-- 5. Set them in your Vercel Environment Variables or local .env file!
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Box',
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand TEXT NOT NULL,
  model TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  condition TEXT NOT NULL, -- 'Like New', 'Excellent', 'Good', 'Fair'
  stock_status TEXT NOT NULL DEFAULT 'IN_STOCK', -- 'IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT DEFAULT '',
  specifications JSONB DEFAULT '{}'::jsonb,
  is_featured INTEGER DEFAULT 0,
  is_new_arrival INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 5. Combos Table
CREATE TABLE IF NOT EXISTS combos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  image TEXT DEFAULT '',
  stock_status TEXT NOT NULL DEFAULT 'IN_STOCK',
  is_featured INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Combo Items Table
CREATE TABLE IF NOT EXISTS combo_items (
  id SERIAL PRIMARY KEY,
  combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  custom_label TEXT DEFAULT ''
);

-- 7. Site Settings Table (Full CMS)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Enquiries Table (WhatsApp & Call Analytics)
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT DEFAULT '',
  type TEXT NOT NULL, -- 'WHATSAPP' or 'CALL'
  ip_hash TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_combos_slug ON combos(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo_id ON combo_items(combo_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted API backend access
DO $$
BEGIN
  -- Admins table policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to admins' AND tablename = 'admins') THEN
    CREATE POLICY "Allow all access to admins" ON admins FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to categories' AND tablename = 'categories') THEN
    CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Products policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to products' AND tablename = 'products') THEN
    CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Product Images policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to product_images' AND tablename = 'product_images') THEN
    CREATE POLICY "Allow all access to product_images" ON product_images FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Combos policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to combos' AND tablename = 'combos') THEN
    CREATE POLICY "Allow all access to combos" ON combos FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Combo Items policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to combo_items' AND tablename = 'combo_items') THEN
    CREATE POLICY "Allow all access to combo_items" ON combo_items FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Site Settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to site_settings' AND tablename = 'site_settings') THEN
    CREATE POLICY "Allow all access to site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Enquiries policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to enquiries' AND tablename = 'enquiries') THEN
    CREATE POLICY "Allow all access to enquiries" ON enquiries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- STORAGE BUCKET FOR HARDWARE IMAGES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pc-parts-images', 'pc-parts-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access pc-parts-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public Access pc-parts-images" ON storage.objects FOR SELECT USING (bucket_id = 'pc-parts-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload pc-parts-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public Upload pc-parts-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pc-parts-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update pc-parts-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public Update pc-parts-images" ON storage.objects FOR UPDATE USING (bucket_id = 'pc-parts-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete pc-parts-images' AND tablename = 'objects') THEN
    CREATE POLICY "Public Delete pc-parts-images" ON storage.objects FOR DELETE USING (bucket_id = 'pc-parts-images');
  END IF;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Default Administrator (Username: admin | Password: pcparthub@2026)
INSERT INTO admins (username, password_hash, name)
VALUES ('admin', '$2a$10$.Gv6LEMliYVI34AFOKFE2.nytalxU861ZEsZUruhSdIOYMSpc1c2W', 'Store Administrator')
ON CONFLICT (username) DO NOTHING;

-- 2. Categories
INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active) VALUES
(1, 'GPU / Graphics Cards', 'gpu', 'CircuitBoard', 'NVIDIA RTX, GTX & AMD Radeon cards tested under full thermal load', 1, 1),
(2, 'CPU / Processors', 'cpu', 'Cpu', 'Intel Core & AMD Ryzen multi-core desktop processors', 2, 1),
(3, 'Motherboards', 'motherboard', 'Grid', 'ATX, Micro-ATX & Mini-ITX boards with bent-pin and VRM check', 3, 1),
(4, 'RAM / Memory', 'ram', 'Layers', 'DDR4 & DDR5 high-frequency memory kits tested for zero errors', 4, 1),
(5, 'Storage (SSD & HDD)', 'storage', 'HardDrive', 'NVMe Gen4, Gen3 SSDs and mechanical drives with 100% SMART health', 5, 1),
(6, 'Power Supplies (PSU)', 'psu', 'Zap', '80+ Bronze, Gold & Platinum modular and non-modular units', 6, 1),
(7, 'Cabinets & Cases', 'cabinet', 'Box', 'Tempered glass airflow cases cleaned and inspected', 7, 1),
(8, 'Cooling & AIOs', 'cooling', 'Fan', '240mm/360mm Liquid coolers and dual-tower air coolers', 8, 1),
(9, 'Monitors', 'monitor', 'Monitor', 'High-refresh rate gaming and color-accurate IPS panels', 9, 1),
(10, 'Accessories & Peripherals', 'accessories', 'Headphones', 'Mechanical keyboards, mice, and internal PC accessories', 10, 1)
ON CONFLICT (slug) DO NOTHING;

-- Reset sequence for categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 3. Default Site Settings & Full CMS Keys
INSERT INTO site_settings (key, value) VALUES
('business_name', 'PC PART HUB'),
('tagline', 'Pre-Owned Parts. Tested for Your Build.'),
('sub_tagline', 'Find the hardware you need. Check the specs. Talk directly to PC Part Hub.'),
('phone', '+91 91795 27017'),
('whatsapp', '919179527017'),
('address', 'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019'),
('maps_url', 'https://maps.google.com/?q=Nehru+Place+New+Delhi'),
('opening_hours', 'Mon – Sat: 11:00 AM – 8:30 PM (Sunday by Appointment)'),
('instagram_url', 'https://instagram.com/pcparthub'),
('about_text', 'PC PART HUB is a specialized showroom and digital inventory of tested, verified, and certified pre-owned computer hardware. Every GPU, processor, and motherboard undergoes rigorous benchmark testing before cataloguing.'),
('currency', '₹'),
-- Hero Banner CMS
('hero_badge', 'PC PART HUB • NEHRU PLACE SHOWROOM'),
('hero_title', 'Power Your Next Build.'),
('hero_subtitle', 'Quality pre-owned PC hardware, ready for your next setup.'),
('hero_desc', 'Find the hardware you need. Check the real specs. Talk directly to PC Part Hub on WhatsApp or visit our live Nehru Place test-bench showroom.'),
('hero_image', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85'),
('hero_chip1_tag', 'CERTIFIED PRE-OWNED'),
('hero_chip2_label', 'STRESS TESTED'),
('hero_chip2_val', '100% Passed'),
('hero_chip3_text', 'Nehru Place Store Pickup & Testing Available'),
('hero_chip4_text', 'Real Stock Updated Hourly'),
-- Trust Cards CMS
('trust_card_1_title', 'TESTED HARDWARE'),
('trust_card_1_desc', 'Stress-tested with FurMark, Cinebench & MemTest before inventory intake.'),
('trust_card_2_title', 'REAL INVENTORY'),
('trust_card_2_desc', 'Live stock tracking. What you see is available in our store right now.'),
('trust_card_3_title', 'CLEAR CONDITION'),
('trust_card_3_desc', 'Transparent physical and functional condition ratings with inspection photos.'),
('trust_card_4_title', 'DIRECT WHATSAPP SUPPORT'),
('trust_card_4_desc', 'Speak directly with our hardware technicians for build advice and orders.')
ON CONFLICT (key) DO NOTHING;

-- 4. Seed Products
INSERT INTO products (id, product_code, name, slug, category_id, brand, model, price, condition, stock_status, quantity, description, specifications, is_featured, is_new_arrival) VALUES
(1, 'GPU-001', 'ZOTAC Gaming GeForce RTX 3060 Twin Edge 12GB', 'zotac-rtx-3060-twin-edge-12gb', 1, 'ZOTAC', 'RTX 3060 Twin Edge', 18500, 'Like New', 'IN_STOCK', 3, 'Tested thoroughly under 45-minute FurMark stress test. Temps peak at 67°C. Cleaned, no rust, repasted with Noctua NT-H1 thermal compound. Includes original box.', '{"VRAM": "12GB GDDR6", "Interface": "PCIe 4.0 x16", "Outputs": "3x DisplayPort 1.4a, 1x HDMI 2.1", "Power Connectors": "1x 8-Pin", "Recommended PSU": "550W", "Length": "224mm"}'::jsonb, 1, 1),
(2, 'GPU-002', 'ASUS ROG Strix GeForce RTX 3070 OC 8GB', 'asus-rog-strix-rtx-3070-oc-8gb', 1, 'ASUS ROG', 'RTX 3070 OC Edition', 26999, 'Excellent', 'IN_STOCK', 2, 'Massive triple-fan cooling system. ARGB lighting fully functional. Pristine backplate condition, zero coil whine under load. Tested with Time Spy & Cyberpunk 2077.', '{"VRAM": "8GB GDDR6", "Interface": "PCIe 4.0 x16", "Outputs": "2x HDMI 2.1, 3x DisplayPort 1.4a", "Power Connectors": "2x 8-Pin", "Recommended PSU": "650W", "Length": "318mm"}'::jsonb, 1, 0),
(3, 'GPU-003', 'Sapphire Pulse AMD Radeon RX 6700 XT 12GB', 'sapphire-pulse-rx-6700-xt-12gb', 1, 'Sapphire', 'Pulse RX 6700 XT', 21500, 'Like New', 'LOW_STOCK', 1, 'Outstanding 1440p gaming card with 12GB VRAM. Dual ball bearing fans running whisper quiet. Comes with original packaging and documentation.', '{"VRAM": "12GB GDDR6", "Memory Bus": "192-bit", "Power Connectors": "1x 8-Pin + 1x 6-Pin", "Recommended PSU": "650W", "Length": "260mm"}'::jsonb, 1, 1),
(4, 'CPU-001', 'AMD Ryzen 5 5600X Desktop Processor', 'amd-ryzen-5-5600x', 2, 'AMD', 'Ryzen 5 5600X', 9800, 'Like New', 'IN_STOCK', 4, 'Clean pins, 100% straight, zero damage. Prime95 tested for 1 hour with zero throttling. Excellent budget 6-core gaming king on AM4 platform.', '{"Socket": "AM4", "Cores / Threads": "6 Cores / 12 Threads", "Base Clock": "3.7 GHz", "Boost Clock": "4.6 GHz", "TDP": "65W", "Architecture": "Zen 3 (7nm)"}'::jsonb, 1, 0),
(5, 'CPU-002', 'Intel Core i5-12400F 12th Gen Alder Lake', 'intel-core-i5-12400f', 2, 'Intel', 'i5-12400F', 8900, 'Like New', 'IN_STOCK', 5, 'LGA1700 processor in mint state. Flat IHS with no warping. Paired with Wraith stealth / stock cooler upon request.', '{"Socket": "LGA1700", "Cores / Threads": "6 Cores (6P+0E) / 12 Threads", "Base Clock": "2.5 GHz", "Boost Clock": "4.4 GHz", "TDP": "65W Base (117W Turbo)", "PCIe Support": "PCIe 5.0 & 4.0"}'::jsonb, 0, 1),
(6, 'CPU-003', 'AMD Ryzen 7 5800X3D with 3D V-Cache', 'amd-ryzen-7-5800x3d', 2, 'AMD', 'Ryzen 7 5800X3D', 22000, 'Excellent', 'SOLD_OUT', 0, 'The legendary ultimate gaming upgrade for AM4 systems. 96MB of L3 3D V-Cache delivers insane frame rates in simulation and esports titles.', '{"Socket": "AM4", "Cores / Threads": "8 Cores / 16 Threads", "L3 Cache": "96MB 3D V-Cache", "Boost Clock": "4.5 GHz", "TDP": "105W"}'::jsonb, 1, 0),
(7, 'MB-001', 'MSI MAG B550 TOMAHAWK Gaming Motherboard', 'msi-mag-b550-tomahawk', 3, 'MSI', 'MAG B550 TOMAHAWK', 9500, 'Like New', 'IN_STOCK', 2, 'All slots, PCIe lanes, USB ports, and dual Realtek 2.5G LAN tested. Updated to latest BIOS supporting Ryzen 5000 series out of the box. Includes I/O shield and SATA cables.', '{"Socket": "AM4", "Chipset": "AMD B550", "Form Factor": "ATX", "RAM Slots": "4x DDR4 (up to 128GB)", "M.2 Slots": "2x M.2 (1x PCIe 4.0 with Shield Frozr)", "Power Design": "10+2+1 Duet Rail VRM"}'::jsonb, 1, 0),
(8, 'RAM-001', 'Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz', 'corsair-vengeance-lpx-32gb-ddr4-3200', 4, 'Corsair', 'Vengeance LPX Black', 4800, 'Like New', 'IN_STOCK', 6, 'Low-profile pure aluminum heat spreader. 100% passed 4 passes of MemTest86 with zero errors. XMP 2.0 profile boots flawlessly at 3200MHz CL16.', '{"Capacity": "32GB (2 x 16GB)", "Type": "DDR4", "Speed": "3200MHz", "Timing": "CL16-20-20-38", "Voltage": "1.35V"}'::jsonb, 0, 1),
(9, 'RAM-002', 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz CL30', 'gskill-trident-z5-rgb-32gb-ddr5-6000', 4, 'G.Skill', 'Trident Z5 RGB', 9200, 'Like New', 'LOW_STOCK', 1, 'Top-tier sweet-spot kit for Ryzen 7000 / Intel 13th-14th Gen. Pristine matte black aluminum heatsink with fluid RGB diffuser. AMD EXPO and Intel XMP certified.', '{"Capacity": "32GB (2 x 16GB)", "Type": "DDR5", "Speed": "6000MHz", "Timing": "CL30-38-38-96", "RGB": "Yes (Addressable RGB)"}'::jsonb, 1, 1),
(10, 'SSD-001', 'Samsung 980 PRO 1TB PCIe 4.0 NVMe M.2 SSD', 'samsung-980-pro-1tb-nvme', 5, 'Samsung', '980 PRO', 5900, 'Like New', 'IN_STOCK', 3, 'Verified 99% SMART Health on Samsung Magician. Total Bytes Written (TBW) under 8TB of 600TB rated endurance. Speeds tested: 7,000 MB/s Read / 5,000 MB/s Write.', '{"Capacity": "1TB", "Interface": "PCIe Gen 4.0 x4, NVMe 1.3c", "Form Factor": "M.2 (2280)", "Sequential Read": "Up to 7,000 MB/s", "Sequential Write": "Up to 5,000 MB/s", "Health": "99% SMART Health"}'::jsonb, 1, 0),
(11, 'PSU-001', 'Corsair RM750x 750W 80+ Gold Fully Modular PSU', 'corsair-rm750x-750w-gold-modular', 6, 'Corsair', 'RM750x', 6200, 'Excellent', 'IN_STOCK', 2, 'Tier-A legendary power supply with 105°C Japanese capacitors. Zero RPM fan mode for silent idle. Complete with all original modular cables in Corsair pouch.', '{"Wattage": "750W", "Efficiency": "80 PLUS Gold Certified", "Modularity": "Full Modular", "Fan Size": "135mm Magnetic Levitation Fan", "Cables Included": "24-pin ATX, 2x EPS 8-pin, 4x PCIe 8-pin, 9x SATA"}'::jsonb, 1, 0),
(12, 'CASE-001', 'Lian Li LANCOOL 216 RGB Mid-Tower Cabinet', 'lian-li-lancool-216-rgb', 7, 'Lian Li', 'LANCOOL 216 RGB Black', 5200, 'Like New', 'IN_STOCK', 1, 'Dual 160mm front ARGB fans deliver unmatched GPU & CPU thermals. Zero scratches on tempered glass. Includes fan hub and all bracket accessories.', '{"Form Factor": "Mid Tower (E-ATX / ATX / M-ATX)", "Included Fans": "2x 160mm ARGB Front, 1x 140mm PWM Rear", "GPU Clearance": "Up to 392mm", "Radiator Support": "Up to 360mm top/front", "Side Panel": "4.0mm Tempered Glass"}'::jsonb, 0, 1)
ON CONFLICT (slug) DO NOTHING;

-- Reset sequence for products
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 5. Product Images
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80', 1, 0),
(1, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1000&q=80', 0, 1),
(2, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80', 1, 0),
(3, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80', 1, 0),
(4, 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1000&q=80', 1, 0),
(5, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1000&q=80', 1, 0),
(6, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80', 1, 0),
(7, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80', 1, 0),
(8, 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80', 1, 0),
(9, 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80', 1, 0),
(10, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80', 1, 0),
(11, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1000&q=80', 1, 0),
(12, 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=1000&q=80', 1, 0)
ON CONFLICT DO NOTHING;

-- 6. Seed Combos
INSERT INTO combos (id, title, slug, description, price, image, stock_status, is_featured) VALUES
(1, 'Esports 1080p Ultra Gaming Combo', 'esports-1080p-gaming-combo', 'Ryzen 5 5600X + B550 Tomahawk + 32GB DDR4 3200MHz RAM. Perfect base to drop in any RTX 3060/4060 GPU for 144Hz+ competitive gaming.', 22999, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1000&q=80', 'IN_STOCK', 1),
(2, 'Next-Gen 1440p Content & Gaming Core', 'nextgen-1440p-gaming-combo', 'Intel Core i5-12400F + RTX 3070 8GB OC + 750W 80+ Gold Corsair PSU. Plug & play 1440p High/Ultra setup tested together under synchronous load.', 40500, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80', 'IN_STOCK', 1)
ON CONFLICT (slug) DO NOTHING;

-- Reset sequence for combos
SELECT setval('combos_id_seq', (SELECT MAX(id) FROM combos));

-- 7. Combo Items
INSERT INTO combo_items (combo_id, product_id, custom_label) VALUES
(1, 4, 'AMD Ryzen 5 5600X Processor'),
(1, 7, 'MSI MAG B550 TOMAHAWK Motherboard'),
(1, 8, 'Corsair 32GB (2x16GB) DDR4 3200MHz RAM'),
(2, 5, 'Intel Core i5-12400F 6-Core CPU'),
(2, 2, 'ASUS ROG Strix RTX 3070 OC 8GB'),
(2, 11, 'Corsair RM750x 750W 80+ Gold PSU')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 8. Admin Account Seed
-- Default login: username = admin, password = pcparthub@2026
-- Change this password immediately after first login via Admin → Settings
-- ==============================================================================
INSERT INTO admins (username, password_hash, name)
VALUES (
  'admin',
  '$2a$10$adFKLaQljYEmrPnb4BFNsuSlVCCPGuX1WWDZXTF9W2BImO9QU1ySa',
  'Store Administrator'
)
ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- 9. Default Site Settings
-- Edit these values from Admin Panel → Settings after first login
-- ==============================================================================
INSERT INTO site_settings (key, value) VALUES
  ('business_name',    'PC PART HUB'),
  ('tagline',          'Pre-Owned Parts. Tested for Your Build.'),
  ('sub_tagline',      'Find the hardware you need. Check the specs. Talk directly to PC Part Hub.'),
  ('phone',            '+91 91795 27017'),
  ('whatsapp',         '919179527017'),
  ('address',          'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019'),
  ('maps_url',         'https://maps.google.com/?q=Nehru+Place+New+Delhi'),
  ('opening_hours',    'Mon – Sat: 11:00 AM – 8:30 PM (Sunday by Appointment)'),
  ('instagram_url',    'https://instagram.com/pcparthub'),
  ('about_text',       'PC PART HUB is a specialized showroom and digital inventory of tested, verified, and certified pre-owned computer hardware. Every GPU, processor, and motherboard undergoes rigorous benchmark testing before cataloguing.'),
  ('currency',         '₹'),
  ('trust_card_1_title', 'TESTED HARDWARE'),
  ('trust_card_1_desc',  'Stress-tested with FurMark, Cinebench & MemTest before inventory intake.'),
  ('trust_card_2_title', 'REAL INVENTORY'),
  ('trust_card_2_desc',  'Live stock tracking. What you see is available in our store right now.'),
  ('trust_card_3_title', 'CLEAR CONDITION'),
  ('trust_card_3_desc',  'Transparent physical and functional condition ratings with inspection photos.'),
  ('trust_card_4_title', 'DIRECT WHATSAPP SUPPORT'),
  ('trust_card_4_desc',  'Speak directly with our hardware technicians for build advice and orders.')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- SCHEMA & DATA SETUP COMPLETE
-- Login: admin / pcparthub@2026  ← Change after first login!
-- ==============================================================================
