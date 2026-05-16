CREATE TABLE IF NOT EXISTS
  social_links (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  platform TEXT NOT NULL,
  -- 'facebook','instagram','tiktok',etc
  label TEXT,
  -- display name
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE social_links
  ENABLE ROW LEVEL SECURITY;
  
-- Drop existing policy if exists to avoid error
DROP POLICY IF EXISTS "social_links_all" ON social_links;

CREATE POLICY "social_links_all"
  ON social_links FOR ALL
  USING (true);

-- Default social links
INSERT INTO social_links
  (platform, label, url, 
   is_active, display_order)
VALUES
  ('facebook', 'Facebook',
   'https://facebook.com/missashop',
   true, 1),
  ('instagram', 'Instagram',
   'https://instagram.com/missashop',
   true, 2),
  ('tiktok', 'TikTok',
   'https://tiktok.com/@missashop',
   true, 3),
  ('youtube', 'YouTube',
   'https://youtube.com/@missashop',
   false, 4),
  ('twitter', 'Twitter / X',
   'https://twitter.com/missashop',
   false, 5),
  ('whatsapp', 'WhatsApp',
   'https://wa.me/1234567890',
   false, 6),
  ('pinterest', 'Pinterest',
   'https://pinterest.com/missashop',
   false, 7),
  ('snapchat', 'Snapchat',
   'https://snapchat.com/add/missashop',
   false, 8)
ON CONFLICT DO NOTHING;
