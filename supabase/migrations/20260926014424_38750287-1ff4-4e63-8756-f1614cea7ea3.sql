CREATE TABLE public.payment_settings (
  user_id uuid PRIMARY KEY,
  method text NOT NULL CHECK (method IN ('sync', 'infinite')),
  sync_client_id text,
  sync_environment text NOT NULL DEFAULT 'sandbox' CHECK (sync_environment IN ('sandbox', 'producao')),
  infinite_handle text,
  credentials_ciphertext text,
  credentials_iv text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read payment settings" ON public.payment_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners add payment settings" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners edit payment settings" ON public.payment_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete payment settings" ON public.payment_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.touch_payment_settings() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER touch_payment_settings BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.touch_payment_settings();