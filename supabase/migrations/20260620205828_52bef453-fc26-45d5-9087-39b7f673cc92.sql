
CREATE TABLE public.pharmacy_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  name TEXT NOT NULL DEFAULT 'PharmaSys',
  slogan TEXT,
  nuit TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  receipt_width TEXT NOT NULL DEFAULT '80mm' CHECK (receipt_width IN ('58mm','80mm','a4')),
  receipt_header TEXT,
  receipt_footer TEXT DEFAULT 'Obrigado pela preferência!',
  show_pharmacist BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pharmacy_settings TO authenticated;
GRANT INSERT, UPDATE ON public.pharmacy_settings TO authenticated;
GRANT ALL ON public.pharmacy_settings TO service_role;

ALTER TABLE public.pharmacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings: any authenticated read" ON public.pharmacy_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings: admin insert" ON public.pharmacy_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Settings: admin update" ON public.pharmacy_settings
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER pharmacy_settings_updated_at
  BEFORE UPDATE ON public.pharmacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.pharmacy_settings (id, name, slogan, nuit, address, city, phone, email, receipt_header, receipt_footer)
VALUES (true, 'PharmaSys', 'A sua saúde, a nossa missão', '400123456', 'Av. 25 de Setembro, nº 123', 'Maputo, Moçambique', '+258 84 000 0000', 'geral@pharmasys.mz', NULL, 'Obrigado pela preferência! Volte sempre.');
