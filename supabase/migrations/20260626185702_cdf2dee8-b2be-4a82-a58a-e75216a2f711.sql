
CREATE TYPE public.account_kind AS ENUM ('payable', 'receivable');
CREATE TYPE public.account_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.account_kind NOT NULL,
  description TEXT NOT NULL,
  party TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  status public.account_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view financial accounts"
  ON public.financial_accounts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert financial accounts"
  ON public.financial_accounts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update financial accounts"
  ON public.financial_accounts FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete financial accounts"
  ON public.financial_accounts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_financial_accounts_status ON public.financial_accounts(status);
CREATE INDEX idx_financial_accounts_due ON public.financial_accounts(due_date);
