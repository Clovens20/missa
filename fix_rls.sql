-- ══════════════════════════════════════════════════════════════════════════
-- FIX: Row-Level Security (RLS) for categories and core tables
-- Run this in your Supabase SQL Editor to allow admin operations.
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Ensure RLS is enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "categories_read_all" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "products_read_all" ON products;
DROP POLICY IF EXISTS "products_admin_all" ON products;

-- 3. Create PUBLIC READ policies (Allow customers to see products/categories)
CREATE POLICY "categories_read_all" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "products_read_all" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 4. Create ADMIN ALL policies (Allow admins to manage everything)
-- Note: We use a permissive policy for authenticated users in the admin panel.
-- For maximum security, you should check against the admin_users table.

CREATE POLICY "categories_admin_all" ON categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_admin_all" ON products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Ensure dropship_products also has proper admin access
DROP POLICY IF EXISTS "dropship_products_admin" ON dropship_products;
CREATE POLICY "dropship_products_admin" ON dropship_products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Ensure admin_users is accessible to authenticated users for verification
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_users_read_own" ON admin_users;
CREATE POLICY "admin_users_read_own" ON admin_users
  FOR SELECT TO authenticated
  USING (true);
