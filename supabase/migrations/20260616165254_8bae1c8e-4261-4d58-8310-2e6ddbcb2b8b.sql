
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'pharmacist', 'cashier');
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjust', 'loss', 'return');
CREATE TYPE public.sale_status AS ENUM ('completed', 'canceled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'debit', 'credit', 'pix', 'other');
CREATE TYPE public.alert_type AS ENUM ('low_stock', 'near_expiry', 'expired');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.medicine_tarja AS ENUM ('livre', 'amarela', 'vermelha', 'preta');

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ HAS_ROLE FUNCTION ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','pharmacist'));
$$;

-- Auto-create profile + default role 'cashier' on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  SELECT COUNT(*) INTO v_count FROM public.user_roles;
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cashier');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile policies
CREATE POLICY "Profiles: own read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Profiles: own update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Profiles: admin insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Profiles: admin delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Roles: read own or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Roles: admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: read" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories: staff manage" ON public.categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Suppliers: read" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers: staff manage" ON public.suppliers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active_ingredient TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  manufacturer TEXT,
  barcode TEXT UNIQUE,
  tarja public.medicine_tarja DEFAULT 'livre',
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  unit TEXT DEFAULT 'un',
  min_stock INT NOT NULL DEFAULT 5,
  ideal_stock INT NOT NULL DEFAULT 20,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_products_name ON public.products USING gin (to_tsvector('simple', name));
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE POLICY "Products: read" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products: staff manage" ON public.products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ BATCHES ============
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_batches_product ON public.batches(product_id);
CREATE INDEX idx_batches_expiry ON public.batches(expiry_date);
CREATE POLICY "Batches: read" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Batches: staff manage" ON public.batches FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type public.movement_type NOT NULL,
  quantity INT NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_movements_product ON public.stock_movements(product_id);
CREATE POLICY "Movements: read" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Movements: authenticated insert" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Customers: read" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Customers: authenticated manage" ON public.customers FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============ SALES ============
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number BIGSERIAL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  status public.sale_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_created ON public.sales(created_at);
CREATE POLICY "Sales: read" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales: authenticated insert" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Sales: staff update" ON public.sales FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ============ SALE ITEMS ============
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  batch_id UUID REFERENCES public.batches(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON public.sale_items(product_id);
CREATE POLICY "SaleItems: read" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "SaleItems: authenticated insert" ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts: read" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Alerts: authenticated manage" ON public.alerts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit: admin read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Audit: authenticated insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============ RPC: process_sale ============
CREATE OR REPLACE FUNCTION public.process_sale(
  p_customer_id UUID,
  p_payment_method public.payment_method,
  p_discount NUMERIC,
  p_items JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sale_id UUID;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_remaining INT;
  v_batch RECORD;
  v_take INT;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  -- Compute subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount,0));

  INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status)
  VALUES (p_customer_id, v_user, v_subtotal, COALESCE(p_discount,0), v_total, p_payment_method, 'completed')
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    IF v_product IS NULL THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

    v_remaining := (v_item->>'quantity')::INT;

    -- FEFO
    FOR v_batch IN
      SELECT * FROM public.batches
      WHERE product_id = v_product.id AND quantity > 0 AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_take := LEAST(v_batch.quantity, v_remaining);
      UPDATE public.batches SET quantity = quantity - v_take WHERE id = v_batch.id;

      INSERT INTO public.sale_items(sale_id, product_id, batch_id, product_name, quantity, unit_price, total)
      VALUES (v_sale_id, v_product.id, v_batch.id, v_product.name, v_take,
              (v_item->>'unit_price')::NUMERIC, v_take * (v_item->>'unit_price')::NUMERIC);

      INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id, reference_id)
      VALUES (v_batch.id, v_product.id, 'out', v_take, 'Venda', v_user, v_sale_id);

      v_remaining := v_remaining - v_take;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_product.name;
    END IF;
  END LOOP;

  RETURN v_sale_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.process_sale(UUID, public.payment_method, NUMERIC, JSONB) TO authenticated;

-- ============ RPC: add_batch_entry ============
CREATE OR REPLACE FUNCTION public.add_batch_entry(
  p_product_id UUID,
  p_supplier_id UUID,
  p_batch_number TEXT,
  p_expiry_date DATE,
  p_quantity INT,
  p_cost_price NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_batch_id UUID;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_staff(v_user) THEN RAISE EXCEPTION 'Permissão negada'; END IF;

  INSERT INTO public.batches(product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
  VALUES (p_product_id, p_supplier_id, p_batch_number, p_expiry_date, p_quantity, p_cost_price)
  RETURNING id INTO v_batch_id;

  INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id)
  VALUES (v_batch_id, p_product_id, 'in', p_quantity, 'Entrada de estoque', v_user);

  RETURN v_batch_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.add_batch_entry(UUID, UUID, TEXT, DATE, INT, NUMERIC) TO authenticated;

-- ============ RPC: refresh_alerts (chamada periodicamente) ============
CREATE OR REPLACE FUNCTION public.refresh_alerts() RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  DELETE FROM public.alerts WHERE resolved = false;

  -- Estoque baixo
  FOR r IN
    SELECT p.id, p.name, p.min_stock,
      COALESCE(SUM(b.quantity) FILTER (WHERE b.expiry_date >= CURRENT_DATE), 0) AS total_qty
    FROM public.products p
    LEFT JOIN public.batches b ON b.product_id = p.id
    WHERE p.active = true
    GROUP BY p.id
  LOOP
    IF r.total_qty = 0 THEN
      INSERT INTO public.alerts(type, severity, product_id, message)
      VALUES ('low_stock', 'critical', r.id, r.name || ' está sem estoque');
    ELSIF r.total_qty <= r.min_stock * 0.5 THEN
      INSERT INTO public.alerts(type, severity, product_id, message)
      VALUES ('low_stock', 'warning', r.id, r.name || ' com estoque crítico (' || r.total_qty || ' un)');
    ELSIF r.total_qty <= r.min_stock THEN
      INSERT INTO public.alerts(type, severity, product_id, message)
      VALUES ('low_stock', 'info', r.id, r.name || ' próximo do mínimo (' || r.total_qty || ' un)');
    END IF;
  END LOOP;

  -- Vencimento
  FOR r IN
    SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
      (b.expiry_date - CURRENT_DATE) AS days_left
    FROM public.batches b JOIN public.products p ON p.id = b.product_id
    WHERE b.quantity > 0
  LOOP
    IF r.days_left < 0 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('expired', 'critical', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' VENCIDO');
    ELSIF r.days_left <= 30 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'critical', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence em ' || r.days_left || ' dias');
    ELSIF r.days_left <= 60 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'warning', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence em ' || r.days_left || ' dias');
    ELSIF r.days_left <= 90 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'info', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence em ' || r.days_left || ' dias');
    END IF;
  END LOOP;
END; $$;
GRANT EXECUTE ON FUNCTION public.refresh_alerts() TO authenticated;
