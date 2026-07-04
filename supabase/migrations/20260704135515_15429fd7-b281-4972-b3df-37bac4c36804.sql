
DROP POLICY IF EXISTS "Demo: anon can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Demo: anon can view batches" ON public.batches;
DROP POLICY IF EXISTS "Demo: anyone manage batches" ON public.batches;
DROP POLICY IF EXISTS "Demo: anon can view categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: anyone manage categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: anon can view customers" ON public.customers;
DROP POLICY IF EXISTS "Demo: anyone manage customers" ON public.customers;
DROP POLICY IF EXISTS "Demo: anon can view products" ON public.products;
DROP POLICY IF EXISTS "Demo: anyone manage products" ON public.products;
DROP POLICY IF EXISTS "Demo: anon can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Demo: anon can view sales" ON public.sales;
DROP POLICY IF EXISTS "Demo: anon can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Demo: anyone manage suppliers" ON public.suppliers;

REVOKE ALL ON public.alerts, public.batches, public.categories, public.customers,
              public.products, public.sale_items, public.sales, public.suppliers,
              public.stock_movements, public.account_movements, public.cash_sessions,
              public.financial_accounts, public.pharmacy_settings, public.profiles,
              public.user_roles, public.audit_logs
       FROM anon;

REVOKE EXECUTE ON FUNCTION public.process_sale(uuid, payment_method, numeric, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.process_sale(uuid, payment_method, numeric, jsonb, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_batch_entry(uuid, uuid, text, date, integer, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.open_cash_session(numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.close_cash_session(numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.adjust_account(uuid, text, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_account(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.refresh_alerts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.process_sale(uuid, payment_method, numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale(uuid, payment_method, numeric, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_batch_entry(uuid, uuid, text, date, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_cash_session(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cash_session(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_account(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
