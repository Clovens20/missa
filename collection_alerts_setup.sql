CREATE TABLE IF NOT EXISTS 
  collection_subscribers (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  -- Preferences
  categories JSONB DEFAULT '[]',
  -- [] = all categories
  notify_new_products BOOLEAN 
    DEFAULT true,
  notify_flash_sales BOOLEAN 
    DEFAULT true,
  notify_restocks BOOLEAN 
    DEFAULT true,
  -- Status
  confirmed BOOLEAN DEFAULT false,
  confirm_token TEXT UNIQUE DEFAULT
    encode(gen_random_bytes(32),'hex'),
  unsubscribe_token TEXT UNIQUE DEFAULT
    encode(gen_random_bytes(32),'hex'),
  -- Stats
  emails_sent INTEGER DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  -- Meta
  source TEXT DEFAULT 'popup',
  -- popup|footer|product|checkout
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification history
CREATE TABLE IF NOT EXISTS
  collection_notifications (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  -- new_products|flash_sale|restock
  products JSONB DEFAULT '[]',
  -- Products included in email
  recipients_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- RLS
ALTER TABLE collection_subscribers
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_notifications
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscribers_insert"
  ON collection_subscribers 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "subscribers_select_own"
  ON collection_subscribers 
  FOR SELECT USING (true);

CREATE POLICY "subscribers_admin"
  ON collection_subscribers 
  FOR ALL USING (true);

CREATE POLICY "notifications_admin"
  ON collection_notifications 
  FOR ALL USING (true);
