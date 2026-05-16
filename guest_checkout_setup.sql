-- Guest sessions / abandoned carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder email log
CREATE TABLE IF NOT EXISTS cart_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false
);

-- Guest orders (no account needed)
CREATE TABLE IF NOT EXISTS guest_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  session_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  payment_method TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  notes TEXT,
  tracking_number TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_reminder ON abandoned_carts(last_reminder_sent, converted, email) WHERE converted = false AND email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(email);
CREATE INDEX IF NOT EXISTS idx_guest_orders_number ON guest_orders(order_number);

-- RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;

-- Public can insert/read own cart
CREATE POLICY IF NOT EXISTS "carts_public" ON abandoned_carts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "guest_orders_public" ON guest_orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "reminders_service" ON cart_reminders FOR ALL USING (true);
