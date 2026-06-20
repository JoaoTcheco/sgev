
-- ============ CASH SESSIONS ============
CREATE TYPE public.cash_session_status AS ENUM ('open', 'closed');

CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_amount numeric(12,2) NOT NULL DEFAULT 0,
  counted_amount numeric(12,2),
  expected_amount numeric(12,2),
  difference numeric(12,2),
  notes text,
  status public.cash_session_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cash_sessions_one_open_per_user
  ON public.cash_sessions(user_id) WHERE status = 'open';

GRANT SELECT, INSERT, UPDATE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cash: own or admin read" ON public.cash_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Cash: admin manage" ON public.cash_sessions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_cash_sessions_updated_at
  BEFORE UPDATE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Link sales to a session
ALTER TABLE public.sales
  ADD COLUMN cash_session_id uuid REFERENCES public.cash_sessions(id);

CREATE INDEX idx_sales_cash_session ON public.sales(cash_session_id);

-- Open a cash session
CREATE OR REPLACE FUNCTION public.open_cash_session(p_opening numeric)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM cash_sessions WHERE user_id = v_user AND status = 'open') THEN
    RAISE EXCEPTION 'Já existe um turno aberto';
  END IF;
  INSERT INTO cash_sessions(user_id, opening_amount) VALUES (v_user, COALESCE(p_opening, 0))
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- Close current open session for the caller
CREATE OR REPLACE FUNCTION public.close_cash_session(p_counted numeric, p_notes text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_session cash_sessions%ROWTYPE;
  v_cash_sales numeric;
  v_expected numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_session FROM cash_sessions WHERE user_id = v_user AND status = 'open';
  IF v_session.id IS NULL THEN RAISE EXCEPTION 'Sem turno aberto'; END IF;

  SELECT COALESCE(SUM(total), 0) INTO v_cash_sales
  FROM sales
  WHERE cash_session_id = v_session.id AND payment_method = 'cash' AND status = 'completed';

  v_expected := v_session.opening_amount + v_cash_sales;

  UPDATE cash_sessions
    SET status = 'closed',
        closed_at = now(),
        counted_amount = COALESCE(p_counted, 0),
        expected_amount = v_expected,
        difference = COALESCE(p_counted, 0) - v_expected,
        notes = p_notes
  WHERE id = v_session.id;

  RETURN v_session.id;
END; $$;

-- Patch process_sale to attach the current open session
CREATE OR REPLACE FUNCTION public.process_sale(p_customer_id uuid, p_payment_method payment_method, p_discount numeric, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_unit_kind TEXT;
  v_qty_units INT;
  v_qty_display INT;
  v_unit_price NUMERIC;
  v_unit_label TEXT;
  v_receipt TEXT;
  v_session_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  SELECT id INTO v_session_id FROM public.cash_sessions
    WHERE user_id = v_user AND status = 'open' LIMIT 1;
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Abra um turno de caixa antes de registar vendas';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount,0));

  v_receipt := 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.sales_receipt_seq')::text, 6, '0');

  INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status, receipt_number, cash_session_id)
  VALUES (p_customer_id, v_user, v_subtotal, COALESCE(p_discount,0), v_total, p_payment_method, 'completed', v_receipt, v_session_id)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    IF v_product IS NULL THEN RAISE EXCEPTION 'Produto nao encontrado'; END IF;

    v_unit_kind := COALESCE(v_item->>'unit_kind', 'pack');
    v_qty_display := (v_item->>'quantity')::INT;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;

    IF v_unit_kind = 'sub' THEN
      v_qty_units := v_qty_display;
      v_unit_label := COALESCE(v_product.sub_unit_label, 'unidade');
    ELSE
      v_qty_units := v_qty_display * GREATEST(1, v_product.pack_size);
      v_unit_label := COALESCE(v_product.unit, 'cx');
    END IF;

    v_remaining := v_qty_units;

    FOR v_batch IN
      SELECT * FROM public.batches
      WHERE product_id = v_product.id AND quantity > 0 AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_take := LEAST(v_batch.quantity, v_remaining);
      UPDATE public.batches SET quantity = quantity - v_take WHERE id = v_batch.id;

      INSERT INTO public.sale_items(sale_id, product_id, batch_id, product_name, quantity, unit_price, total, unit_kind, unit_label)
      VALUES (
        v_sale_id, v_product.id, v_batch.id, v_product.name,
        CASE WHEN v_unit_kind = 'sub' THEN v_take ELSE CEIL(v_take::NUMERIC / GREATEST(1, v_product.pack_size))::INT END,
        v_unit_price,
        CASE WHEN v_unit_kind = 'sub' THEN v_take * v_unit_price
             ELSE CEIL(v_take::NUMERIC / GREATEST(1, v_product.pack_size))::INT * v_unit_price END,
        v_unit_kind,
        v_unit_label
      );

      INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id, reference_id)
      VALUES (v_batch.id, v_product.id, 'out', v_take, 'Venda', v_user, v_sale_id);

      v_remaining := v_remaining - v_take;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_product.name;
    END IF;
  END LOOP;

  RETURN v_sale_id;
END;
$function$;

-- ============ DELETION APPROVALS ============
CREATE TYPE public.deletion_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  entity_label text,
  reason text NOT NULL,
  status public.deletion_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deletion_pending ON public.deletion_requests(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.deletion_requests TO authenticated;
GRANT ALL ON public.deletion_requests TO service_role;

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deletions: own or admin read" ON public.deletion_requests
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Deletions: staff create" ON public.deletion_requests
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "Deletions: admin manage" ON public.deletion_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_deletion_updated_at
  BEFORE UPDATE ON public.deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Whitelist of entities that can be requested for deletion
CREATE OR REPLACE FUNCTION public.request_deletion(p_entity text, p_entity_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_user uuid := auth.uid(); v_label text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_staff(v_user) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_entity NOT IN ('sale', 'product', 'supplier', 'customer') THEN
    RAISE EXCEPTION 'Entidade não suportada: %', p_entity;
  END IF;
  IF coalesce(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;
  IF EXISTS (SELECT 1 FROM deletion_requests
             WHERE entity = p_entity AND entity_id = p_entity_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Já existe um pedido pendente para este item';
  END IF;

  v_label := CASE p_entity
    WHEN 'sale' THEN (SELECT 'Venda ' || COALESCE(receipt_number, sale_number::text) FROM sales WHERE id = p_entity_id)
    WHEN 'product' THEN (SELECT name FROM products WHERE id = p_entity_id)
    WHEN 'supplier' THEN (SELECT legal_name FROM suppliers WHERE id = p_entity_id)
    WHEN 'customer' THEN (SELECT full_name FROM customers WHERE id = p_entity_id)
  END;

  INSERT INTO deletion_requests(entity, entity_id, entity_label, reason, requested_by)
  VALUES (p_entity, p_entity_id, v_label, p_reason, v_user)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- Approve / reject. On approve, perform the deletion.
CREATE OR REPLACE FUNCTION public.review_deletion(p_id uuid, p_approve boolean, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_req deletion_requests%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_admin(v_user) THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  SELECT * INTO v_req FROM deletion_requests WHERE id = p_id;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Pedido já revisto'; END IF;

  IF p_approve THEN
    -- Perform the deletion. For sales, cancel rather than hard delete.
    IF v_req.entity = 'sale' THEN
      UPDATE sales SET status = 'cancelled' WHERE id = v_req.entity_id;
    ELSIF v_req.entity = 'product' THEN
      UPDATE products SET active = false WHERE id = v_req.entity_id;
    ELSIF v_req.entity = 'supplier' THEN
      UPDATE suppliers SET active = false WHERE id = v_req.entity_id;
    ELSIF v_req.entity = 'customer' THEN
      DELETE FROM customers WHERE id = v_req.entity_id;
    END IF;
    UPDATE deletion_requests SET status='approved', reviewed_by=v_user, reviewed_at=now(), review_reason=p_reason WHERE id=p_id;
  ELSE
    UPDATE deletion_requests SET status='rejected', reviewed_by=v_user, reviewed_at=now(), review_reason=p_reason WHERE id=p_id;
  END IF;
END; $$;
