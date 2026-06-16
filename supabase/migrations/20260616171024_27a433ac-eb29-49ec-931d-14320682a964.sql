
GRANT SELECT ON public.categories, public.suppliers, public.products, public.batches,
  public.customers, public.sales, public.sale_items, public.alerts TO anon;

CREATE POLICY "Demo: anon can view categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view suppliers"  ON public.suppliers  FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view products"   ON public.products   FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view batches"    ON public.batches    FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view customers"  ON public.customers  FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view sales"      ON public.sales      FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view sale_items" ON public.sale_items FOR SELECT TO anon USING (true);
CREATE POLICY "Demo: anon can view alerts"     ON public.alerts     FOR SELECT TO anon USING (true);

DO $seed$
DECLARE
  c_analg UUID; c_antib UUID; c_antit UUID; c_vit UUID; c_derm UUID;
  s_medley UUID; s_eurofarma UUID; s_ems UUID;
  p RECORD;
  v_sale UUID; v_cust UUID;
  i INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN RETURN; END IF;

  INSERT INTO public.categories(name, description) VALUES ('Analgésicos','Alívio de dor e febre') RETURNING id INTO c_analg;
  INSERT INTO public.categories(name, description) VALUES ('Antibióticos','Tratamento de infecções') RETURNING id INTO c_antib;
  INSERT INTO public.categories(name, description) VALUES ('Antitérmicos','Redução de febre') RETURNING id INTO c_antit;
  INSERT INTO public.categories(name, description) VALUES ('Vitaminas','Suplementos vitamínicos') RETURNING id INTO c_vit;
  INSERT INTO public.categories(name, description) VALUES ('Dermatológicos','Cuidados com a pele') RETURNING id INTO c_derm;

  INSERT INTO public.suppliers(legal_name, contact_name, phone, email)
    VALUES ('Medley Distribuidora','João Silva','(11) 3000-1000','contato@medley.com') RETURNING id INTO s_medley;
  INSERT INTO public.suppliers(legal_name, contact_name, phone, email)
    VALUES ('EuroFarma','Maria Souza','(11) 3000-2000','vendas@eurofarma.com') RETURNING id INTO s_eurofarma;
  INSERT INTO public.suppliers(legal_name, contact_name, phone, email)
    VALUES ('EMS Pharma','Carlos Lima','(11) 3000-3000','ems@ems.com') RETURNING id INTO s_ems;

  INSERT INTO public.products(name, active_ingredient, category_id, manufacturer, barcode, tarja, requires_prescription, unit, min_stock, ideal_stock, cost_price, sale_price) VALUES
    ('Dipirona 500mg 20cp','Dipirona Sódica',c_analg,'Medley','7891000001','livre',false,'cx',10,50, 4.50, 9.90),
    ('Paracetamol 750mg 20cp','Paracetamol',c_antit,'EMS','7891000002','livre',false,'cx',10,50, 5.20,11.50),
    ('Ibuprofeno 400mg 20cp','Ibuprofeno',c_analg,'EuroFarma','7891000003','livre',false,'cx',8,40, 7.80,16.90),
    ('Amoxicilina 500mg 21cp','Amoxicilina',c_antib,'EMS','7891000004','vermelha',true,'cx',5,20,18.00,38.00),
    ('Azitromicina 500mg 5cp','Azitromicina',c_antib,'Medley','7891000005','vermelha',true,'cx',5,20,22.00,49.00),
    ('Vitamina C 1g 10cp eferv','Ácido Ascórbico',c_vit,'EuroFarma','7891000006','livre',false,'tb',15,60, 6.00,14.50),
    ('Complexo B 30cp','Vitaminas B',c_vit,'Medley','7891000007','livre',false,'fr',10,40, 8.50,19.90),
    ('Nimesulida 100mg 12cp','Nimesulida',c_analg,'EMS','7891000008','livre',false,'cx',12,50, 5.00,12.00),
    ('Loratadina 10mg 12cp','Loratadina',c_analg,'EuroFarma','7891000009','livre',false,'cx',10,40, 6.50,15.00),
    ('Omeprazol 20mg 28cp','Omeprazol',c_analg,'EMS','7891000010','livre',false,'cx',10,40, 8.00,18.00),
    ('Pomada Cicatrizante 30g','Sulfato de Neomicina',c_derm,'Medley','7891000011','livre',false,'bg',8,30,10.00,24.00),
    ('Protetor Solar FPS 50','Filtro UV',c_derm,'EuroFarma','7891000012','livre',false,'fr',6,20,28.00,59.90);

  FOR p IN SELECT id, name, sale_price, cost_price FROM public.products LOOP
    INSERT INTO public.batches(product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
    VALUES (p.id, s_medley, 'L' || substr(p.id::text,1,6) || '-A',
            CURRENT_DATE + (180 + (random()*180)::INT), 30 + (random()*40)::INT, p.cost_price);
  END LOOP;

  UPDATE public.batches SET quantity = 3
    WHERE product_id = (SELECT id FROM public.products WHERE name LIKE 'Amoxicilina%');
  UPDATE public.batches SET quantity = 8
    WHERE product_id = (SELECT id FROM public.products WHERE name LIKE 'Vitamina C%');

  INSERT INTO public.batches(product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
  SELECT id, s_eurofarma, 'L-EXP-SOON', CURRENT_DATE + 18, 15, cost_price
    FROM public.products WHERE name LIKE 'Paracetamol%';

  INSERT INTO public.batches(product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
  SELECT id, s_ems, 'L-EXP-45', CURRENT_DATE + 45, 12, cost_price
    FROM public.products WHERE name LIKE 'Azitromicina%';

  INSERT INTO public.customers(full_name, tax_id, phone, email) VALUES
    ('Ana Carolina Mendes','123.456.789-00','(11) 98888-1111','ana@email.com'),
    ('Bruno Ferreira','234.567.890-11','(11) 98888-2222','bruno@email.com'),
    ('Carla Oliveira','345.678.901-22','(11) 98888-3333','carla@email.com'),
    ('Diego Santos','456.789.012-33','(11) 98888-4333','diego@email.com');

  FOR i IN 1..20 LOOP
    SELECT id INTO v_cust FROM public.customers ORDER BY random() LIMIT 1;
    INSERT INTO public.sales(customer_id, user_id, subtotal, discount, total, payment_method, status, created_at)
    VALUES (
      CASE WHEN random() < 0.7 THEN v_cust ELSE NULL END,
      NULL, 0, 0, 0,
      (ARRAY['cash','debit','credit','pix']::payment_method[])[1 + (random()*3)::INT],
      'completed',
      now() - ((random()*30)::INT || ' days')::INTERVAL - ((random()*12)::INT || ' hours')::INTERVAL
    ) RETURNING id INTO v_sale;

    INSERT INTO public.sale_items(sale_id, product_id, batch_id, product_name, quantity, unit_price, total)
    SELECT v_sale, pr.id,
      (SELECT id FROM public.batches WHERE product_id = pr.id LIMIT 1),
      pr.name, q.qty, pr.sale_price, q.qty * pr.sale_price
    FROM (SELECT id, name, sale_price FROM public.products ORDER BY random() LIMIT 1 + (random()*3)::INT) pr
    CROSS JOIN LATERAL (SELECT 1 + (random()*3)::INT AS qty) q;

    UPDATE public.sales SET
      subtotal = (SELECT COALESCE(SUM(total),0) FROM public.sale_items WHERE sale_id = v_sale),
      total    = (SELECT COALESCE(SUM(total),0) FROM public.sale_items WHERE sale_id = v_sale)
    WHERE id = v_sale;
  END LOOP;

  PERFORM public.refresh_alerts();
END
$seed$;
