-- ════════════════════════════════════════════════════════════
-- TAX MANAGEMENT SYSTEM SETUP
-- ════════════════════════════════════════════════════════════

-- 1. CREATE SHOP SETTINGS TABLE (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES AND CREATE OPEN POLICIES
DROP POLICY IF EXISTS "shop_settings_public_read" ON shop_settings;
CREATE POLICY "shop_settings_public_read" ON shop_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "shop_settings_admin_all" ON shop_settings;
CREATE POLICY "shop_settings_admin_all" ON shop_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. SEED INITIAL TAX SETTINGS
INSERT INTO shop_settings 
  (key, value) 
VALUES
  ('tax_enabled', 'false'),
  ('tax_rates', '{
    "CA_QC": {
      "name": "TPS + TVQ",
      "rate": 14.975,
      "enabled": false
    },
    "CA_ON": {
      "name": "HST Ontario", 
      "rate": 13.00,
      "enabled": false
    },
    "CA_BC": {
      "name": "GST + PST BC",
      "rate": 12.00,
      "enabled": false
    },
    "CA_AB": {
      "name": "GST Alberta",
      "rate": 5.00,
      "enabled": false
    },
    "CA_MB": {
      "name": "GST + PST Manitoba",
      "rate": 12.00,
      "enabled": false
    },
    "CA_NB": {
      "name": "HST New Brunswick",
      "rate": 15.00,
      "enabled": false
    },
    "CA_NL": {
      "name": "HST Newfoundland",
      "rate": 15.00,
      "enabled": false
    },
    "CA_NS": {
      "name": "HST Nova Scotia",
      "rate": 15.00,
      "enabled": false
    },
    "CA_PE": {
      "name": "HST PEI",
      "rate": 15.00,
      "enabled": false
    },
    "CA_SK": {
      "name": "GST + PST Saskatchewan",
      "rate": 11.00,
      "enabled": false
    },
    "CA_NT": {
      "name": "GST NWT",
      "rate": 5.00,
      "enabled": false
    },
    "CA_NU": {
      "name": "GST Nunavut",
      "rate": 5.00,
      "enabled": false
    },
    "CA_YT": {
      "name": "GST Yukon",
      "rate": 5.00,
      "enabled": false
    }
  }')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
