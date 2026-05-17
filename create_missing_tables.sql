-- ════════════════════════════════════════════════════════════
-- 1. CREATE MISSING COUPONS TABLE
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  description TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_product_id ON coupons(product_id);

-- Enable RLS and add policies for Coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_read" ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "coupons_admin_all" ON coupons;
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- 2. CREATE MISSING ORDERS TABLE
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  payment_status TEXT,
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

-- Enable RLS and add policies for Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_admin_all" ON orders;
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- 3. UPGRADE GUEST_ORDERS TABLE FOR STRIPE
-- ════════════════════════════════════════════════════════════
ALTER TABLE guest_orders 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

CREATE INDEX IF NOT EXISTS idx_guest_orders_stripe ON guest_orders(stripe_session_id);
