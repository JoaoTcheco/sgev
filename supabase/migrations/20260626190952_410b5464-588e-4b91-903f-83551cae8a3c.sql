
-- Reestrutura financial_accounts como "carteiras" de entrada de dinheiro
DROP TABLE IF EXISTS public.financial_accounts CASCADE;
DROP TYPE IF EXISTS public.account_kind CASCADE;
DROP TYPE IF EXISTS public.account_status CASCADE;

CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  notes TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read accounts" ON public.financial_accounts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'cashier'));
CREATE POLICY "admin manage accounts" ON public.financial_accounts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_fa_updated BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Movimentos da conta (entradas de vendas, ajustes manuais)
CREATE TABLE public.account_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit','reset')),
  amount NUMERIC(14,2) NOT NULL,
  reason TEXT,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.account_movements TO authenticated;
GRANT ALL ON public.account_movements TO service_role;
ALTER TABLE public.account_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read movements" ON public.account_movements FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'cashier'));
CREATE POLICY "system insert movements" ON public.account_movements FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_account_movements_account ON public.account_movements(account_id, created_at DESC);

-- Conta de Caixa padrão (sistema, não eliminável)
INSERT INTO public.financial_accounts (name, is_system, notes)
VALUES ('Caixa', true, 'Conta principal de numerário — não pode ser eliminada')
ON CONFLICT (name) DO NOTHING;

-- Vendas: referenciar conta de destino do dinheiro
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL;

-- Ajuste manual de saldo (subtrair / zerar)
CREATE OR REPLACE FUNCTION public.adjust_account(
  p_account_id UUID, p_type TEXT, p_amount NUMERIC, p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_acc public.financial_accounts%ROWTYPE;
  v_id UUID;
  v_delta NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF NOT public.is_admin(v_user) THEN RAISE EXCEPTION 'Permissao negada'; END IF;
  IF p_type NOT IN ('credit','debit','reset') THEN RAISE EXCEPTION 'Tipo invalido'; END IF;

  SELECT * INTO v_acc FROM public.financial_accounts WHERE id = p_account_id FOR UPDATE;
  IF v_acc.id IS NULL THEN RAISE EXCEPTION 'Conta nao encontrada'; END IF;

  IF p_type = 'reset' THEN
    v_delta := -v_acc.balance;
    INSERT INTO public.account_movements(account_id, type, amount, reason, user_id)
      VALUES (p_account_id, 'reset', v_acc.balance, COALESCE(p_reason,'Zerar conta'), v_user)
      RETURNING id INTO v_id;
    UPDATE public.financial_accounts SET balance = 0, updated_at = now() WHERE id = p_account_id;
  ELSE
    IF COALESCE(p_amount,0) <= 0 THEN RAISE EXCEPTION 'Valor deve ser maior que zero'; END IF;
    v_delta := CASE WHEN p_type='credit' THEN p_amount ELSE -p_amount END;
    INSERT INTO public.account_movements(account_id, type, amount, reason, user_id)
      VALUES (p_account_id, p_type, p_amount, p_reason, v_user)
      RETURNING id INTO v_id;
    UPDATE public.financial_accounts SET balance = balance + v_delta, updated_at = now()
      WHERE id = p_account_id;
  END IF;

  RETURN v_id;
END; $$;

-- Eliminar conta com proteção
CREATE OR REPLACE FUNCTION public.delete_account(p_account_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sys BOOLEAN;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Permissao negada'; END IF;
  SELECT is_system INTO v_sys FROM public.financial_accounts WHERE id = p_account_id;
  IF v_sys IS NULL THEN RAISE EXCEPTION 'Conta nao encontrada'; END IF;
  IF v_sys THEN RAISE EXCEPTION 'Conta do sistema nao pode ser eliminada'; END IF;
  DELETE FROM public.financial_accounts WHERE id = p_account_id;
END; $$;

-- process_sale agora credita a conta selecionada (Caixa por defeito)
CREATE OR REPLACE FUNCTION public.process_sale(
  p_customer_id UUID, p_payment_method payment_method, p_discount NUMERIC,
  p_items JSONB, p_account_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_product.name;
    END IF;
  END LOOP;

  -- Credita conta de destino
  INSERT INTO public.account_movements(account_id, type, amount, reason, sale_id, user_id)
    VALUES (v_account_id, 'credit', v_total, 'Venda ' || v_receipt, v_sale_id, v_user);
  UPDATE public.financial_accounts SET balance = balance + v_total, updated_at = now()
    WHERE id = v_account_id;

  RETURN v_sale_id;
END; $$;
