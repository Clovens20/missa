-- ══════════════════════════════
-- FEATURE 1: PRODUCT BUNDLES
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value DECIMAL(10,2) DEFAULT 15,
  products JSONB DEFAULT '[]',
  original_price DECIMAL(10,2),
  bundle_price DECIMAL(10,2),
  savings DECIMAL(10,2),
  stock_limit INTEGER,
  sold_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════
-- FEATURE 2: AFFILIATES
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  website_url TEXT,
  audience_size TEXT,
  niche TEXT,
  why_join TEXT,
  ref_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 8.00,
  status TEXT DEFAULT 'pending',
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  payout_method TEXT DEFAULT 'paypal',
  payout_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  ref_code TEXT NOT NULL,
  page_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  order_number TEXT,
  order_total DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════
-- FEATURE 3: B2B WHOLESALE
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS wholesale_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  business_type TEXT,
  country TEXT DEFAULT 'CA',
  province TEXT,
  city TEXT,
  address TEXT,
  years_in_business TEXT,
  estimated_monthly_order TEXT,
  products_interested TEXT[],
  how_heard TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  account_type TEXT DEFAULT 'standard',
  discount_rate DECIMAL(5,2) DEFAULT 30.00,
  min_order_amount DECIMAL(10,2) DEFAULT 200.00,
  credit_limit DECIMAL(10,2),
  payment_terms TEXT DEFAULT 'prepaid',
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wholesale_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES wholesale_applications(id),
  order_number TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update site_settings for toggles:
INSERT INTO site_settings (key, value, label, category)
VALUES
  ('feature_bundles', 'false', '🎁 Bundles Produits', 'features'),
  ('feature_affiliates', 'false', '🤝 Programme Affiliés', 'features'),
  ('feature_wholesale', 'false', '🏢 B2B Wholesale', 'features')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bundles_public_read" ON bundles;
CREATE POLICY "bundles_public_read" ON bundles FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "bundles_admin" ON bundles;
CREATE POLICY "bundles_admin" ON bundles FOR ALL USING (true);
DROP POLICY IF EXISTS "affiliates_public" ON affiliates;
CREATE POLICY "affiliates_public" ON affiliates FOR ALL USING (true);
DROP POLICY IF EXISTS "clicks_public" ON affiliate_clicks;
CREATE POLICY "clicks_public" ON affiliate_clicks FOR ALL USING (true);
DROP POLICY IF EXISTS "commissions_admin" ON affiliate_commissions;
CREATE POLICY "commissions_admin" ON affiliate_commissions FOR ALL USING (true);
DROP POLICY IF EXISTS "wholesale_public" ON wholesale_applications;
CREATE POLICY "wholesale_public" ON wholesale_applications FOR ALL USING (true);
DROP POLICY IF EXISTS "wholesale_orders_admin" ON wholesale_orders;
CREATE POLICY "wholesale_orders_admin" ON wholesale_orders FOR ALL USING (true);
