ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_sub_barcode_uidx ON public.products(sub_barcode) WHERE sub_barcode IS NOT NULL;