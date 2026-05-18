-- Add video_url column to the main products table if it doesn't already exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Verify columns
COMMENT ON COLUMN products.video_url IS 'URL of the product video imported from CJ Dropshipping';
