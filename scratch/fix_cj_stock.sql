-- Add CJ sync columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cj_product_id TEXT,
  ADD COLUMN IF NOT EXISTS cj_variants JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cj_status TEXT DEFAULT 'ENABLE',
  ADD COLUMN IF NOT EXISTS last_stock_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier TEXT DEFAULT 'cj';

-- Index for fast CJ sync queries
CREATE INDEX IF NOT EXISTS idx_products_cj_id
  ON products(cj_product_id)
  WHERE cj_product_id IS NOT NULL;

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  synced_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  out_of_stock_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies for sync_logs (allow admin to see them)
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs_select" ON sync_logs FOR SELECT USING (true);
