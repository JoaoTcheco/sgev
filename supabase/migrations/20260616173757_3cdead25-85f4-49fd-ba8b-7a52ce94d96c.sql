
-- Categorias
DROP POLICY IF EXISTS "Demo: anyone manage categories" ON public.categories;
CREATE POLICY "Demo: anyone manage categories" ON public.categories
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;

-- Produtos
DROP POLICY IF EXISTS "Demo: anyone manage products" ON public.products;
CREATE POLICY "Demo: anyone manage products" ON public.products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;

-- Fornecedores
DROP POLICY IF EXISTS "Demo: anyone manage suppliers" ON public.suppliers;
CREATE POLICY "Demo: anyone manage suppliers" ON public.suppliers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon;

-- Clientes
DROP POLICY IF EXISTS "Demo: anyone manage customers" ON public.customers;
CREATE POLICY "Demo: anyone manage customers" ON public.customers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon;

-- Lotes
DROP POLICY IF EXISTS "Demo: anyone manage batches" ON public.batches;
CREATE POLICY "Demo: anyone manage batches" ON public.batches
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO anon;
GRANT SELECT ON public.batches TO anon;
