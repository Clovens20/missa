-- Add video_urls array column to products table
-- This allows multiple videos per product
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- Backfill: copy existing video_url into video_urls array if not empty
UPDATE products 
SET video_urls = ARRAY[video_url]
WHERE video_url IS NOT NULL 
  AND video_url != ''
  AND (video_urls IS NULL OR array_length(video_urls, 1) IS NULL);

-- Verify
SELECT id, name, video_url, video_urls 
FROM products 
WHERE video_url IS NOT NULL OR video_urls IS NOT NULL
LIMIT 10;
