-- 1. Ajouter la colonne subcategory_id à la table products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.categories(id);

-- 2. Ajouter la colonne wholesale_moq à la table products (Par défaut 10)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS wholesale_moq INTEGER DEFAULT 10;

-- 3. Mettre à jour les produits existants pour s'assurer qu'ils ont le MOQ par défaut (s'ils étaient à NULL)
UPDATE public.products SET wholesale_moq = 10 WHERE wholesale_moq IS NULL;

-- 4. Recharger le cache du schéma pour l'API PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
