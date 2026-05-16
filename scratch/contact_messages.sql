-- Table pour stocker les messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'read', 'replied'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation de la sécurité (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde à envoyer un message (INSERT)
CREATE POLICY "contact_messages_insert" 
ON contact_messages FOR INSERT 
WITH CHECK (true);

-- Autoriser l'accès complet (admin) - Dans un vrai environnement, on filtrerait par rôle
CREATE POLICY "contact_messages_admin_all" 
ON contact_messages FOR ALL 
USING (true);
