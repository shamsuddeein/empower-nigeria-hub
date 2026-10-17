-- Migration 0002: Coherent Publishing Model and Secured Application Submission
-- 1. Publishing controls: separate commercial availability from publication status
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- Update RLS to ensure drafts remain strictly private from public queries
DROP POLICY IF EXISTS "public read" ON public.plots;
CREATE POLICY "public read" ON public.plots FOR SELECT USING ((is_published = true) OR public.is_admin());

DROP POLICY IF EXISTS "public read" ON public.products;
CREATE POLICY "public read" ON public.products FOR SELECT USING ((is_published = true) OR public.is_admin());

-- 2. Applications snapshot columns for authoritative audit trail
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS deposit integer NOT NULL DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS charges integer NOT NULL DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_count integer;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS total_amount integer;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS plan_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Hardened, authoritative submit_application RPC
CREATE OR REPLACE FUNCTION public.submit_application(p jsonb) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref text;
  tries int := 0;
  v_prod record;
  v_markup numeric := 0;
  v_duration int;
  v_freq text;
  v_price int;
  v_total int;
  v_payment_count int;
  v_per_payment int;
  v_full_name text;
  v_phone text;
  v_state text;
  v_lga text;
  v_address text;
  v_occupation text;
BEGIN
  -- Validate applicant required fields
  v_full_name := trim(COALESCE(p->>'full_name', ''));
  IF char_length(v_full_name) < 2 THEN
    RAISE EXCEPTION 'Full name is required (minimum 2 characters)';
  END IF;

  v_phone := trim(COALESCE(p->>'phone', ''));
  IF NOT (v_phone ~ '^0[789][01][0-9]{8}$') THEN
    RAISE EXCEPTION 'Valid Nigerian phone number is required (e.g. 08031234567)';
  END IF;

  v_state := trim(COALESCE(p->>'state', ''));
  IF char_length(v_state) < 2 THEN
    RAISE EXCEPTION 'State is required';
  END IF;

  v_lga := trim(COALESCE(p->>'lga', 'Central'));
  v_address := trim(COALESCE(p->>'address', ''));
  IF char_length(v_address) < 3 THEN
    RAISE EXCEPTION 'Business or residential address is required';
  END IF;

  v_occupation := trim(COALESCE(p->>'occupation', ''));
  IF char_length(v_occupation) < 2 THEN
    RAISE EXCEPTION 'Business trade or occupation is required';
  END IF;

  v_duration := (p->>'duration')::int;
  IF v_duration IS NULL OR v_duration < 1 OR v_duration > 60 THEN
    RAISE EXCEPTION 'Valid repayment duration in months is required';
  END IF;

  v_freq := COALESCE(p->>'frequency', 'weekly');
  IF v_freq NOT IN ('weekly', 'monthly') THEN
    RAISE EXCEPTION 'Frequency must be weekly or monthly';
  END IF;

  -- Authoritative product price and eligibility verification
  IF p->>'product_id' IS NOT NULL AND p->>'product_id' <> '' THEN
    SELECT * INTO v_prod FROM public.products
    WHERE id = (p->>'product_id')::uuid;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected product was not found';
    END IF;

    IF NOT v_prod.is_published THEN
      RAISE EXCEPTION 'Selected product is not currently published for applications';
    END IF;

    v_price := v_prod.cash_price;
  ELSE
    -- If custom/general application without product ID, validate positive price
    v_price := (p->>'price')::int;
    IF v_price IS NULL OR v_price <= 0 THEN
      RAISE EXCEPTION 'Valid positive equipment price is required';
    END IF;
  END IF;

  -- Authoritative markup lookup
  SELECT markup_percent INTO v_markup
  FROM public.installment_rules
  WHERE duration_months = v_duration;

  IF NOT FOUND THEN
    -- Fallback: check closest approved or disallow
    v_markup := 0;
  END IF;

  -- Integer calculations
  v_total := round(v_price * (1.0 + (v_markup / 100.0)))::int;

  IF v_freq = 'monthly' THEN
    v_payment_count := v_duration;
  ELSE
    -- Standard financing schedule: 52 weeks / 12 months = 4.3333 weeks/mo
    v_payment_count := round((v_duration * 52.0) / 12.0)::int;
  END IF;

  IF v_payment_count <= 0 THEN
    v_payment_count := 1;
  END IF;

  v_per_payment := round(v_total::numeric / v_payment_count)::int;

  -- Generate collision-resistant human-readable reference
  LOOP
    ref := 'SIB-' || to_char(now() AT TIME ZONE 'Africa/Lagos', 'YYYYMMDD') || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.applications WHERE reference = ref);
    tries := tries + 1;
    IF tries > 30 THEN
      RAISE EXCEPTION 'Could not allocate application reference code';
    END IF;
  END LOOP;

  -- Insert authoritative application record
  INSERT INTO public.applications (
    reference, category, product_id, product_name, price, duration, frequency, payment_amount,
    full_name, phone, whatsapp, email, state, lga, address, occupation,
    deposit, charges, payment_count, total_amount, plan_snapshot, status
  ) VALUES (
    ref,
    COALESCE(v_prod.category, p->>'category', 'solar'),
    v_prod.id,
    COALESCE(v_prod.name, left(p->>'product_name', 200)),
    v_price,
    v_duration,
    v_freq,
    v_per_payment,
    v_full_name,
    v_phone,
    NULLIF(trim(COALESCE(p->>'whatsapp', '')), ''),
    NULLIF(trim(COALESCE(p->>'email', '')), ''),
    v_state,
    v_lga,
    v_address,
    v_occupation,
    0,
    0,
    v_payment_count,
    v_total,
    jsonb_build_object(
      'cash_price', v_price,
      'markup_percent', v_markup,
      'duration_months', v_duration,
      'frequency', v_freq,
      'payment_count', v_payment_count,
      'per_payment', v_per_payment,
      'total_financed', v_total,
      'deposit', 0,
      'charges', 0,
      'snapshot_at', now()
    ),
    'New'
  );

  RETURN ref;
END $$;

GRANT EXECUTE ON FUNCTION public.submit_application(jsonb) TO anon, authenticated;
