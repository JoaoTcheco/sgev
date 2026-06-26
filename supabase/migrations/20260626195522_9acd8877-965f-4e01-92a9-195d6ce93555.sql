
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS expiry_alert_days INTEGER NOT NULL DEFAULT 60;

CREATE OR REPLACE FUNCTION public.refresh_alerts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r RECORD;
BEGIN
  DELETE FROM public.alerts WHERE resolved = false;

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
    ELSIF r.total_qty <= GREATEST(1, r.min_stock * 0.5) THEN
      INSERT INTO public.alerts(type, severity, product_id, message)
      VALUES ('low_stock', 'critical', r.id, r.name || ' com estoque crítico (' || r.total_qty || ' un, mín ' || r.min_stock || ')');
    ELSIF r.total_qty <= r.min_stock THEN
      INSERT INTO public.alerts(type, severity, product_id, message)
      VALUES ('low_stock', 'warning', r.id, r.name || ' abaixo do mínimo (' || r.total_qty || '/' || r.min_stock || ')');
    END IF;
  END LOOP;

  FOR r IN
    SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
      (b.expiry_date - CURRENT_DATE) AS days_left,
      COALESCE(p.expiry_alert_days, 60) AS alert_days
    FROM public.batches b JOIN public.products p ON p.id = b.product_id
    WHERE b.quantity > 0
  LOOP
    IF r.days_left < 0 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('expired', 'critical', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' VENCIDO há ' || ABS(r.days_left) || ' dias');
    ELSIF r.days_left = 0 THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'critical', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence HOJE');
    ELSIF r.days_left <= GREATEST(1, r.alert_days / 3) THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'critical', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence em ' || r.days_left || ' dias');
    ELSIF r.days_left <= r.alert_days THEN
      INSERT INTO public.alerts(type, severity, product_id, batch_id, message)
      VALUES ('near_expiry', 'warning', r.product_id, r.id,
        r.name || ' lote ' || r.batch_number || ' vence em ' || r.days_left || ' dias');
    END IF;
  END LOOP;
END; $$;

-- Update add_batch_entry to refresh alerts
CREATE OR REPLACE FUNCTION public.add_batch_entry(p_product_id uuid, p_supplier_id uuid, p_batch_number text, p_expiry_date date, p_quantity integer, p_cost_price numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_batch_id UUID;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_staff(v_user) THEN RAISE EXCEPTION 'Permissão negada'; END IF;
  IF p_expiry_date < CURRENT_DATE THEN RAISE EXCEPTION 'Validade no passado'; END IF;

  INSERT INTO public.batches(product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
  VALUES (p_product_id, p_supplier_id, p_batch_number, p_expiry_date, p_quantity, p_cost_price)
  RETURNING id INTO v_batch_id;

  INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id)
  VALUES (v_batch_id, p_product_id, 'in', p_quantity, 'Entrada de estoque', v_user);

  PERFORM public.refresh_alerts();
  RETURN v_batch_id;
END; $$;

-- Update process_sale to refresh alerts at the end and block expired explicitly
CREATE OR REPLACE FUNCTION public.process_sale(p_customer_id uuid, p_payment_method payment_method, p_discount numeric, p_items jsonb, p_account_id uuid DEFAULT NULL::uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_sale_id UUID;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_remaining INT;
  v_avail INT;
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
  v_account_id UUID := p_account_id;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  SELECT id INTO v_session_id FROM public.cash_sessions
    WHERE user_id = v_user AND status = 'open' LIMIT 1;
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Abra um turno de caixa antes de registar vendas';
  END IF;

  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id FROM public.financial_accounts
      WHERE is_system = true AND name = 'Caixa' LIMIT 1;
  END IF;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Conta de destino nao definida'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount,0));

  v_receipt := 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.sales_receipt_seq')::text, 6, '0');

  INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status, receipt_number, cash_session_id, account_id)
  VALUES (p_customer_id, v_user, v_subtotal, COALESCE(p_discount,0), v_total, p_payment_method, 'completed', v_receipt, v_session_id, v_account_id)
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

    SELECT COALESCE(SUM(quantity), 0) INTO v_avail FROM public.batches
      WHERE product_id = v_product.id AND quantity > 0 AND expiry_date >= CURRENT_DATE;
    IF v_avail < v_qty_units THEN
      RAISE EXCEPTION 'Estoque insuficiente para % (disponível: %, necessário: %). Verifique lotes vencidos.', v_product.name, v_avail, v_qty_units;
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
        v_unit_kind, v_unit_label
      );

      INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id, reference_id)
      VALUES (v_batch.id, v_product.id, 'out', v_take, 'Venda', v_user, v_sale_id);

      v_remaining := v_remaining - v_take;
    END LOOP;
  END LOOP;

  INSERT INTO public.account_movements(account_id, type, amount, reason, sale_id, user_id)
    VALUES (v_account_id, 'credit', v_total, 'Venda ' || v_receipt, v_sale_id, v_user);
  UPDATE public.financial_accounts SET balance = balance + v_total, updated_at = now()
    WHERE id = v_account_id;

  PERFORM public.refresh_alerts();
  RETURN v_sale_id;
END; $$;

SELECT public.refresh_alerts();
