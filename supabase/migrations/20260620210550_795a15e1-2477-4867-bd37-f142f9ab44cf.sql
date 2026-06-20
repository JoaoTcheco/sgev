
-- Sequence for receipts
CREATE SEQUENCE IF NOT EXISTS public.sales_receipt_seq START 1;

-- Receipt number column
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE;

-- Backfill existing rows
UPDATE public.sales
SET receipt_number = 'REC-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.sales_receipt_seq')::text, 6, '0')
WHERE receipt_number IS NULL;

-- Recreate process_sale to emit a receipt_number
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
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
  END LOOP;
  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount,0));

  v_receipt := 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.sales_receipt_seq')::text, 6, '0');

  INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status, receipt_number)
  VALUES (p_customer_id, v_user, v_subtotal, COALESCE(p_discount,0), v_total, p_payment_method, 'completed', v_receipt)
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
