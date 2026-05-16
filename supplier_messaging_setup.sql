-- Supplier messages/instructions
CREATE TABLE IF NOT EXISTS 
  supplier_messages (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  -- CJ product reference
  cj_product_id TEXT,
  supplier_name TEXT,
  -- Message type
  type TEXT DEFAULT 'dropship_instruction',
  -- 'dropship_instruction'
  -- |'custom_message'
  -- |'order_note'
  -- |'branding_request'
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  -- CJ API message id if sent
  cj_message_id TEXT,
  -- Status
  status TEXT DEFAULT 'draft',
  -- 'draft'|'sent'|'read'|'replied'
  admin_notes TEXT,
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  reply_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default dropship instructions
-- (saved as templates)
CREATE TABLE IF NOT EXISTS 
  dropship_templates (
  id UUID DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  -- Template name
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  -- 'en'|'fr'|'zh'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO dropship_templates
  (name, subject, content, 
   is_default, language)
VALUES
(
  'Instructions Dropshipping Standard',
  'Dropshipping Order Instructions - No Invoice/Branding',
  'Dear Supplier,

Thank you for fulfilling our order.

IMPORTANT DROPSHIPPING INSTRUCTIONS:

1. NO INVOICE: Please do NOT include
   any invoice, packing slip, or price
   information inside the package.

2. NO BRANDING: Please do NOT include
   any CJDropshipping branding, 
   catalogs, promotional materials, 
   or business cards inside the 
   package.

3. NO PRICE TAGS: Remove all price 
   tags and labels showing the 
   wholesale/supplier price.

4. NEUTRAL PACKAGING: Ship in plain, 
   neutral packaging without any 
   supplier information.

5. BLIND SHIPPING: This is a 
   blind dropship order. The customer
   does not know the source supplier.

6. RETURN ADDRESS: If needed, 
   please use our store name 
   "Missa Shop" as the return sender.

The customer is expecting a package
from our store (Missa Shop), 
not from a supplier.

Thank you for your cooperation!

Best regards,
Missa Shop Team
contact@missashopp.com',
  true,
  'en'
),
(
  'Instructions Dropshipping (Français)',
  'Instructions Dropshipping - Sans Facture',
  'Cher Fournisseur,

Merci de traiter notre commande.

INSTRUCTIONS IMPORTANTES - 
DROPSHIPPING:

1. AUCUNE FACTURE: Ne pas inclure
   de facture, bon de livraison ou 
   information de prix dans le colis.

2. AUCUN BRANDING: Ne pas inclure
   de matériaux CJDropshipping,
   catalogues ou cartes de visite.

3. AUCUNE ÉTIQUETTE DE PRIX: 
   Retirer toutes les étiquettes
   de prix fournisseur.

4. EMBALLAGE NEUTRE: Expédier dans
   un emballage neutre sans 
   information fournisseur.

5. EXPÉDITION AVEUGLE: Commande 
   dropshipping. Le client ne connaît
   pas le fournisseur source.

6. ADRESSE RETOUR: Si nécessaire,
   utiliser "Missa Shop" comme
   expéditeur.

Merci pour votre coopération!

Cordialement,
Missa Shop',
  false,
  'fr'
),
(
  'Branding Request',
  'Custom Branding Request for Dropshipping',
  'Dear Supplier,

We would like to request custom 
branding for our orders.

CUSTOM BRANDING DETAILS:
- Store Name: Missa Shop
- Website: missashopp.com

PACKAGING REQUESTS:
1. No supplier invoice or branding
2. No price information
3. Plain/neutral outer packaging
4. Ship as if from our store

Thank you!
Missa Shop Team',
  false,
  'en'
)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE supplier_messages 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropship_templates 
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_messages_admin" ON supplier_messages;
CREATE POLICY "supplier_messages_admin" 
  ON supplier_messages FOR ALL 
  USING (true);

DROP POLICY IF EXISTS "dropship_templates_admin" ON dropship_templates;
CREATE POLICY "dropship_templates_admin" 
  ON dropship_templates FOR ALL 
  USING (true);

-- Add order note to dropship_orders
ALTER TABLE dropship_orders
  ADD COLUMN IF NOT EXISTS 
    supplier_note TEXT,
  ADD COLUMN IF NOT EXISTS 
    dropship_instructions TEXT;

-- Add to site_settings
INSERT INTO site_settings 
  (key, value, label, category)
VALUES
  ('dropship_default_note',
   '"NO INVOICE - NO BRANDING - DROPSHIP ORDER - Missa Shop"',
   'Note dropship par défaut', 
   'general'),
  ('dropship_store_name',
   '"Missa Shop"',
   'Nom boutique (dropship)', 
   'general'),
  ('dropship_store_email',
   '"contact@missashopp.com"',
   'Email boutique (dropship)', 
   'general')
ON CONFLICT (key) DO NOTHING;
