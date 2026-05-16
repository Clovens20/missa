-- Table pour les messages de contact clients
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut envoyer un message
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Seuls les admins peuvent voir/modifier les messages
CREATE POLICY "contact_admin_all" ON contact_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
  )
);

-- Index pour les perfs
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);
