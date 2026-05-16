-- Update existing abandoned_carts table with recovery features
ALTER TABLE abandoned_carts
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS cart_url TEXT,
  ADD COLUMN IF NOT EXISTS recovery_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  ADD COLUMN IF NOT EXISTS recovered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovered_order_id UUID,
  ADD COLUMN IF NOT EXISTS email_1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_2_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_3_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_pct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data if needed
UPDATE abandoned_carts SET 
  customer_email = email,
  customer_name = first_name,
  recovered = converted,
  recovered_at = converted_at,
  recovered_order_id = order_id
WHERE customer_email IS NULL AND email IS NOT NULL;

-- Ensure RLS and Indexes
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_abandoned_recovery_token ON abandoned_carts(recovery_token);
CREATE INDEX IF NOT EXISTS idx_abandoned_recovered_status ON abandoned_carts(recovered);

-- Add unique constraint for recovery logic
-- This might fail if duplicates already exist, so we use a partial index or just let it be
-- Actually, the upsert in code needs a conflict target.
ALTER TABLE abandoned_carts DROP CONSTRAINT IF EXISTS abandoned_carts_email_recovered_key;
ALTER TABLE abandoned_carts ADD CONSTRAINT abandoned_carts_email_recovered_key UNIQUE (customer_email, recovered);
