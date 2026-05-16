-- Add urgency fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS 
    show_urgency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS
    urgency_stock_limit INTEGER DEFAULT 10,
  -- Show "X left" when below this
  ADD COLUMN IF NOT EXISTS
    fake_viewers_min INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS
    fake_viewers_max INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS
    show_sold_count BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS
    flash_sale_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS
    sold_count INTEGER DEFAULT 0;

-- Same for dropship products
ALTER TABLE dropship_products
  ADD COLUMN IF NOT EXISTS 
    show_urgency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS
    urgency_stock_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS
    fake_viewers_min INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS
    fake_viewers_max INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS
    show_sold_count BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS
    flash_sale_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS
    sold_count INTEGER DEFAULT 0;
