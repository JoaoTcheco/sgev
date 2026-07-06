
-- Track refund state
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS refunded_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS refunded_qty integer NOT NULL DEFAULT 0;

-- Ensure account_movements accepts 'refund' reason freely (type is text-ish; check current type)
-- The refund RPC
CREATE OR REPLACE FUNCTION public.refund_sale(
  p_sale_id uuid,
  p_mode text,               -- 'value' | 'items'
  p_amount numeric DEFAULT NULL,   -- required when mode='value'
  p_items jsonb DEFAULT NULL,      -- required when mode='items': [{sale_item_id, quantity}]
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_sale sales%ROWTYPE;
  v_item jsonb;
  v_si sale_items%ROWTYPE;
  v_qty int;
  v_refund_value numeric := 0;
  v_available_refund numeric;
  v_new_refunded numeric;
  v_pack int;
  v_units_to_return int;
  v_batch_id uuid;
  v_product RECORD;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF NOT public.is_admin(v_user) THEN RAISE EXCEPTION 'Permissao negada: apenas Administrador pode fazer estorno'; END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id FOR UPDATE;
  IF v_sale.id IS NULL THEN RAISE EXCEPTION 'Venda nao encontrada'; END IF;
  IF v_sale.status = 'canceled' THEN RAISE EXCEPTION 'Venda ja anulada'; END IF;

  v_available_refund := v_sale.total - COALESCE(v_sale.refunded_amount, 0);
  IF v_available_refund <= 0 THEN RAISE EXCEPTION 'Venda ja totalmente estornada'; END IF;

  IF p_mode = 'value' THEN
    IF COALESCE(p_amount, 0) <= 0 THEN RAISE EXCEPTION 'Valor de estorno invalido'; END IF;
    IF p_amount > v_available_refund THEN RAISE EXCEPTION 'Valor excede o disponivel (%.2f)', v_available_refund; END IF;
    v_refund_value := p_amount;

  ELSIF p_mode = 'items' THEN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Nenhum item para estorno'; END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      SELECT * INTO v_si FROM public.sale_items
        WHERE id = (v_item->>'sale_item_id')::uuid AND sale_id = p_sale_id
        FOR UPDATE;
      IF v_si.id IS NULL THEN RAISE EXCEPTION 'Item da venda nao encontrado'; END IF;

      v_qty := GREATEST(0, (v_item->>'quantity')::int);
      IF v_qty <= 0 THEN CONTINUE; END IF;
      IF v_qty > (v_si.quantity - COALESCE(v_si.refunded_qty, 0)) THEN
        RAISE EXCEPTION 'Quantidade a estornar excede o vendido para %', v_si.product_name;
      END IF;

      -- Return to stock (original batch if exists)
      SELECT * INTO v_product FROM public.products WHERE id = v_si.product_id;
      v_pack := GREATEST(1, COALESCE(v_product.pack_size, 1));
      v_units_to_return := CASE WHEN v_si.unit_kind = 'sub' THEN v_qty ELSE v_qty * v_pack END;

      v_batch_id := v_si.batch_id;
      IF v_batch_id IS NOT NULL THEN
        UPDATE public.batches SET quantity = quantity + v_units_to_return WHERE id = v_batch_id;
      ELSE
        -- Fallback: newest batch
        SELECT id INTO v_batch_id FROM public.batches
          WHERE product_id = v_si.product_id ORDER BY created_at DESC LIMIT 1;
        IF v_batch_id IS NOT NULL THEN
          UPDATE public.batches SET quantity = quantity + v_units_to_return WHERE id = v_batch_id;
        END IF;
      END IF;

      IF v_batch_id IS NOT NULL THEN
        INSERT INTO public.stock_movements(batch_id, product_id, type, quantity, reason, user_id, reference_id)
        VALUES (v_batch_id, v_si.product_id, 'return', v_units_to_return,
                'Estorno venda ' || COALESCE(v_sale.receipt_number, v_sale.id::text), v_user, v_sale.id);
      END IF;

      UPDATE public.sale_items SET refunded_qty = COALESCE(refunded_qty,0) + v_qty WHERE id = v_si.id;

      v_refund_value := v_refund_value + (v_qty * v_si.unit_price);
    END LOOP;

    IF v_refund_value <= 0 THEN RAISE EXCEPTION 'Nenhuma quantidade valida informada'; END IF;
    IF v_refund_value > v_available_refund THEN
      v_refund_value := v_available_refund;
    END IF;

  ELSE
    RAISE EXCEPTION 'Modo invalido: use value ou items';
  END IF;

  -- Financial: debit the account used
  IF v_sale.account_id IS NOT NULL THEN
    INSERT INTO public.account_movements(account_id, type, amount, reason, sale_id, user_id)
    VALUES (v_sale.account_id, 'debit', v_refund_value,
            'Estorno ' || COALESCE(v_sale.receipt_number, v_sale.id::text) ||
            CASE WHEN p_reason IS NOT NULL AND length(p_reason) > 0 THEN ' — ' || p_reason ELSE '' END,
            v_sale.id, v_user);
    UPDATE public.financial_accounts SET balance = balance - v_refund_value, updated_at = now()
      WHERE id = v_sale.account_id;
  END IF;

  v_new_refunded := COALESCE(v_sale.refunded_amount, 0) + v_refund_value;
  UPDATE public.sales
    SET refunded_amount = v_new_refunded,
        status = CASE WHEN v_new_refunded >= v_sale.total THEN 'canceled'::sale_status ELSE v_sale.status END,
        notes = COALESCE(notes, '') ||
          E'\n[' || to_char(now(),'YYYY-MM-DD HH24:MI') || '] Estorno ' ||
          v_refund_value::text || ' (' || p_mode || ')' ||
          CASE WHEN p_reason IS NOT NULL AND length(p_reason)>0 THEN ' — ' || p_reason ELSE '' END
    WHERE id = v_sale.id;

  PERFORM public.refresh_alerts();

  RETURN jsonb_build_object(
    'sale_id', v_sale.id,
    'refunded', v_refund_value,
    'total_refunded', v_new_refunded,
    'fully_refunded', v_new_refunded >= v_sale.total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_sale(uuid, text, numeric, jsonb, text) TO authenticated;
