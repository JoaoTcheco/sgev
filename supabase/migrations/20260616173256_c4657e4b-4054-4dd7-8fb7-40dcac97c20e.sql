
-- Suporte a sub-unidades (ex: caixinha com 4 carteiras)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pack_size INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sub_unit_label TEXT,
  ADD COLUMN IF NOT EXISTS sub_unit_price NUMERIC(12,2);

-- sale_items: identificar se a linha foi vendida como caixa (pack) ou sub-unidade
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS unit_kind TEXT NOT NULL DEFAULT 'pack',
  ADD COLUMN IF NOT EXISTS unit_label TEXT;

-- Nova process_sale com suporte a unit_kind. Mantém a antiga assinatura por compatibilidade.
CREATE OR REPLACE FUNCTION public.process_sale(
  p_customer_id UUID,
  p_payment_method payment_method,
  p_discount NUMERIC,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_qty_units INT;        -- quantidade em sub-unidades a baixar
  v_qty_display INT;      -- quantidade exibida (caixa ou carteira)
  v_unit_price NUMERIC;
  v_unit_label TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount,0));

  INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status)
  VALUES (p_customer_id, v_user, v_subtotal, COALESCE(p_discount,0), v_total, p_payment_method, 'completed')
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    IF v_product IS NULL THEN RAISE EXCEPTION 'Produto nao encontrado'; END IF;

    v_unit_kind := COALESCE(v_item->>'unit_kind', 'pack');
    v_qty_display := (v_item->>'quantity')::INT;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;

    IF v_unit_kind = 'sub' THEN
      v_qty_units := v_qty_display;                                    -- 1 carteira = 1 sub-unidade
      v_unit_label := COALESCE(v_product.sub_unit_label, 'unidade');
    ELSE
      v_qty_units := v_qty_display * GREATEST(1, v_product.pack_size); -- 1 caixinha = pack_size
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

-- Marca o Paracetamol e a Dipirona como vendíveis em carteira (exemplos reais)
UPDATE public.products
SET pack_size = 4,
    sub_unit_label = 'carteira',
    sub_unit_price = ROUND(sale_price / 4.0, 2)
WHERE name ILIKE 'Paracetamol%' OR name ILIKE 'Dipirona%' OR name ILIKE 'Aspirina%'
   OR name ILIKE 'Amoxicilina%' OR name ILIKE 'Ibuprofeno%';
