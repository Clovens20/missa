-- Product reviews table
CREATE TABLE IF NOT EXISTS 
  product_reviews (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  product_id UUID REFERENCES 
    products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES 
    guest_orders(id) ON DELETE SET NULL,
  -- Customer info
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_avatar TEXT,
  -- Review content
  rating INTEGER NOT NULL 
    CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  -- Media
  images JSONB DEFAULT '[]',
  -- [{url, alt}]
  -- Verified purchase
  is_verified BOOLEAN DEFAULT false,
  -- Admin moderation
  status TEXT DEFAULT 'pending',
  -- pending|approved|rejected
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful votes tracking
CREATE TABLE IF NOT EXISTS 
  review_votes (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  review_id UUID REFERENCES 
    product_reviews(id) 
    ON DELETE CASCADE,
  voter_ip TEXT,
  voter_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_ip)
);

-- Review request emails sent
CREATE TABLE IF NOT EXISTS
  review_requests (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  order_id UUID REFERENCES
    guest_orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  UNIQUE(order_id)
);

-- Add review stats to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS
    review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    review_avg NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    review_breakdown JSONB 
    DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}';

-- Function to update product stats
CREATE OR REPLACE FUNCTION 
  update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    review_count = (
      SELECT COUNT(*) 
      FROM product_reviews
      WHERE product_id = NEW.product_id
      AND status = 'approved'
    ),
    review_avg = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM product_reviews
      WHERE product_id = NEW.product_id
      AND status = 'approved'
    ),
    review_breakdown = (
      SELECT jsonb_build_object(
        '1', COUNT(*) FILTER (WHERE rating=1),
        '2', COUNT(*) FILTER (WHERE rating=2),
        '3', COUNT(*) FILTER (WHERE rating=3),
        '4', COUNT(*) FILTER (WHERE rating=4),
        '5', COUNT(*) FILTER (WHERE rating=5)
      )
      FROM product_reviews
      WHERE product_id = NEW.product_id
      AND status = 'approved'
    )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS 
  review_stats_trigger 
  ON product_reviews;
CREATE TRIGGER review_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION 
    update_product_review_stats();

-- RLS
ALTER TABLE product_reviews 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests 
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "reviews_insert"
  ON product_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reviews_admin"
  ON product_reviews FOR ALL
  USING (true);

CREATE POLICY "votes_all"
  ON review_votes FOR ALL
  USING (true);

CREATE POLICY "requests_admin"
  ON review_requests FOR ALL
  USING (true);
