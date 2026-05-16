-- Footer settings (all sections)
CREATE TABLE IF NOT EXISTS
  footer_settings (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE footer_settings
  ENABLE ROW LEVEL SECURITY;
  
DROP POLICY IF EXISTS "footer_settings_all" ON footer_settings;
CREATE POLICY "footer_settings_all"
  ON footer_settings FOR ALL
  USING (true);

-- Insert default footer data
INSERT INTO footer_settings
  (key, value)
VALUES
  ('contact', '{
    "email": "support@missashop.com",
    "phone": "+1 (514) 000-0000",
    "whatsapp": "",
    "address": ""
  }'),
  ('boutique_links', '[
    {"label": "Femme", "href": "/catalogue?category=Femme"},
    {"label": "Homme", "href": "/catalogue?category=Homme"},
    {"label": "Enfants", "href": "/catalogue?category=Enfants"},
    {"label": "Maison", "href": "/catalogue?category=Maison"},
    {"label": "Beauté", "href": "/catalogue?category=Beaute"},
    {"label": "Promotions", "href": "/catalogue?sale=true"}
  ]'),
  ('aide_links', '[
    {"label": "Mon compte", "href": "/account"},
    {"label": "Mes commandes", "href": "/orders"},
    {"label": "Livraison", "href": "/legal/livraison"},
    {"label": "Retours", "href": "/legal/retours"},
    {"label": "FAQ", "href": "/legal/faq"},
    {"label": "Contact", "href": "/contact"},
    {"label": "Suivi de commande", "href": "/track"},
    {"label": "Programme affiliés", "href": "/affilies"},
    {"label": "Vente en gros", "href": "/wholesale"}
  ]'),
  ('brand', '{
    "name": "Missa Shop",
    "tagline": "Mode & Lifestyle Premium",
    "description": "Votre boutique de mode premium en ligne. Livraison au Canada, USA et Haïti.",
    "copyright": "© 2025 Missa Shop. Tous droits réservés."
  }'),
  ('payments', '[
    "visa", "mastercard",
    "paypal", "applepay", "stripe"
  ]')
ON CONFLICT (key) DO NOTHING;

-- Legal pages
CREATE TABLE IF NOT EXISTS
  legal_pages (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  show_in_footer BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_pages
  ENABLE ROW LEVEL SECURITY;
  
DROP POLICY IF EXISTS "legal_pages_all" ON legal_pages;
CREATE POLICY "legal_pages_all"
  ON legal_pages FOR ALL
  USING (true);

-- Default legal pages
INSERT INTO legal_pages
  (slug, title, content,
   is_active, show_in_footer,
   display_order)
VALUES
  ('cgv',
   'Conditions Générales de Vente',
   '<h2>Conditions Générales de Vente</h2><p>Bienvenue sur Missa Shop. En passant commande sur notre site, vous acceptez les présentes conditions générales de vente.</p><h3>1. Commandes</h3><p>Toute commande passée sur notre site constitue un contrat de vente entre vous et Missa Shop.</p><h3>2. Prix</h3><p>Les prix sont indiqués en dollars américains (USD) toutes taxes comprises.</p><h3>3. Livraison</h3><p>Nous livrons au Canada, aux États-Unis et en Haïti. Les délais varient selon la destination.</p><h3>4. Retours</h3><p>Vous disposez de 30 jours pour retourner un article non utilisé dans son emballage original.</p>',
   true, true, 1),
  ('politique-confidentialite',
   'Politique de Confidentialité',
   '<h2>Politique de Confidentialité</h2><p>Missa Shop s''engage à protéger votre vie privée.</p><h3>1. Données collectées</h3><p>Nous collectons vos informations lors de vos achats: nom, adresse email, adresse de livraison.</p><h3>2. Utilisation</h3><p>Vos données sont utilisées uniquement pour le traitement de vos commandes et l''amélioration de nos services.</p><h3>3. Partage</h3><p>Nous ne vendons jamais vos données à des tiers.</p><h3>4. Contact</h3><p>Pour toute question: support@missashop.com</p>',
   true, true, 2),
  ('politique-retours',
   'Politique de Retours',
   '<h2>Politique de Retours</h2><p>Votre satisfaction est notre priorité.</p><h3>Délai de retour</h3><p>Vous disposez de 30 jours après réception pour retourner votre article.</p><h3>Conditions</h3><p>L''article doit être non utilisé, dans son emballage d''origine avec l''étiquette.</p><h3>Procédure</h3><p>Contactez-nous à support@missashop.com avec votre numéro de commande.</p><h3>Remboursement</h3><p>Le remboursement est effectué sous 5-7 jours ouvrables.</p>',
   true, true, 3),
  ('livraison',
   'Informations de Livraison',
   '<h2>Informations de Livraison</h2><h3>Zones de livraison</h3><p>Nous livrons au Canada, aux États-Unis et en Haïti.</p><h3>Délais</h3><p>Canada: 3-7 jours ouvrables<br/>États-Unis: 5-10 jours ouvrables<br/>Haïti: 10-21 jours ouvrables</p><h3>Frais de livraison</h3><p>Livraison gratuite dès $50 d''achat. En dessous: $8.99</p><h3>Suivi</h3><p>Un numéro de suivi vous est envoyé par email dès l''expédition.</p>',
   true, true, 4),
  ('faq',
   'Questions Fréquentes (FAQ)',
   '<h2>Questions Fréquentes</h2><h3>Comment suivre ma commande?</h3><p>Rendez-vous sur <a href="/track">Suivre ma commande</a> et entrez votre numéro de commande.</p><h3>Quels modes de paiement acceptez-vous?</h3><p>Visa, Mastercard, PayPal, Apple Pay et Stripe.</p><h3>Puis-je modifier ma commande?</h3><p>Contactez-nous dans les 2h suivant la commande à support@missashop.com</p><h3>Les tailles correspondent-elles aux tailles standard?</h3><p>Consultez notre guide des tailles sur chaque fiche produit.</p>',
   true, true, 5),
  ('mentions-legales',
   'Mentions Légales',
   '<h2>Mentions Légales</h2><p>Conformément aux dispositions légales en vigueur.</p><h3>Éditeur</h3><p>Missa Shop<br/>Email: support@missashop.com</p><h3>Hébergement</h3><p>Vercel Inc.<br/>340 Pine Street, San Francisco, CA</p>',
   true, false, 6)
ON CONFLICT (slug) DO NOTHING;
