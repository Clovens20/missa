-- Optimisation des tables de logs et accès admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Autoriser les admins à insérer des logs
CREATE POLICY "admin_logs_insert" ON admin_logs FOR INSERT WITH CHECK (true);

-- Autoriser les admins à voir les logs
CREATE POLICY "admin_logs_select" ON admin_logs FOR SELECT USING (true);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_email ON admin_logs (admin_email);
