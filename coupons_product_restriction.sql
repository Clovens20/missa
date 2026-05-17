-- Add product_id column to coupons table to support product-specific discount codes
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create an index to optimize product-specific coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_product_id ON coupons(product_id);
