-- CJ Token storage
CREATE TABLE IF NOT EXISTS 
  cj_tokens (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dropship products 
-- (imported from CJ)
CREATE TABLE IF NOT EXISTS 
  dropship_products (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  -- CJ data
  cj_product_id TEXT UNIQUE NOT NULL,
  cj_category_id TEXT,
  cj_category_name TEXT,
  -- Product info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  material TEXT,
  -- Pricing
  cj_price DECIMAL(10,2) NOT NULL,
  -- what we pay CJ
  selling_price DECIMAL(10,2) NOT NULL,
  -- what customer pays
  compare_price DECIMAL(10,2),
  profit_margin DECIMAL(10,2),
  -- auto calculated
  -- Shipping
  shipping_time TEXT 
    DEFAULT '7-15 business days',
  shipping_from TEXT DEFAULT 'CN',
  -- CN|US|EU
  cj_shipping_cost DECIMAL(10,2),
  -- Variants
  variants JSONB DEFAULT '[]',
  -- [{vid, name, sku, price, 
  --   image, properties}]
  -- Images
  images JSONB DEFAULT '[]',
  -- [{url, alt}]
  -- Inventory
  stock_quantity INTEGER DEFAULT 999,
  -- CJ manages stock
  -- Categorization
  category_id UUID 
    REFERENCES categories(id),
  tags TEXT[] DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT false,
  -- Must be manually activated
  is_featured BOOLEAN DEFAULT false,
  is_dropship BOOLEAN DEFAULT true,
  -- Always true for CJ products
  -- Stats
  sold_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  -- Meta
  meta_title TEXT,
  meta_description TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dropship orders 
-- (sent to CJ for fulfillment)
CREATE TABLE IF NOT EXISTS 
  dropship_orders (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  -- Links
  guest_order_id UUID 
    REFERENCES guest_orders(id),
  order_number TEXT NOT NULL,
  -- CJ order info
  cj_order_id TEXT,
  -- returned by CJ after creation
  cj_order_number TEXT,
  -- CJ internal reference
  -- Items ordered from CJ
  items JSONB NOT NULL DEFAULT '[]',
  -- [{cj_product_id, vid, qty, 
  --   price, name}]
  -- Shipping info
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT,
  -- Costs
  products_cost DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  -- Status
  status TEXT DEFAULT 'pending',
  -- pending|submitted|processing
  -- |shipped|delivered|cancelled
  -- |failed
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  estimated_delivery TEXT,
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CJ product search cache
-- (avoid repeated API calls)
CREATE TABLE IF NOT EXISTS 
  cj_search_cache (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  search_key TEXT UNIQUE NOT NULL,
  results JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS 
  idx_dropship_products_active
  ON dropship_products(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS
  idx_dropship_products_cj_id
  ON dropship_products(cj_product_id);

CREATE INDEX IF NOT EXISTS
  idx_dropship_orders_order
  ON dropship_orders(guest_order_id);

CREATE INDEX IF NOT EXISTS
  idx_dropship_orders_status
  ON dropship_orders(status);

-- RLS
ALTER TABLE dropship_products 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropship_orders 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cj_tokens 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cj_search_cache 
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dropship_products_public" 
  ON dropship_products FOR SELECT 
  USING (is_active = true);
CREATE POLICY "dropship_products_admin" 
  ON dropship_products FOR ALL 
  USING (true);
CREATE POLICY "dropship_orders_admin" 
  ON dropship_orders FOR ALL 
  USING (true);
CREATE POLICY "cj_tokens_admin" 
  ON cj_tokens FOR ALL 
  USING (true);
CREATE POLICY "cj_cache_admin" 
  ON cj_search_cache FOR ALL 
  USING (true);

-- Add is_dropship column to products 
-- if not exists (for display purposes)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS 
    is_dropship BOOLEAN DEFAULT false;
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS 
    shipping_time TEXT;
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS 
    shipping_from TEXT DEFAULT 'local';

-- Add dropship tracking to site_settings
INSERT INTO site_settings 
  (key, value, label, category)
VALUES
  ('feature_dropshipping', 'false',
   '🌍 Dropshipping CJ', 'features'),
  ('dropship_markup_percentage', '150',
   'Marge dropship (%)', 'general'),
  ('dropship_shipping_note',
   '"Livraison 7-15 jours ouvrables"',
   'Note livraison dropship', 'text')
ON CONFLICT (key) DO NOTHING;
