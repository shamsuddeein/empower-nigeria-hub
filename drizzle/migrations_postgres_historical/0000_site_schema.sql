
CREATE TABLE public.admins (user_id uuid PRIMARY KEY, email text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
$$;
CREATE POLICY "self read" ON public.admins FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('solar','ev','phones','laptops','tablets','accessories','power_banks','others')),
  brand text,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cash_price integer NOT NULL CHECK (cash_price >= 0),
  images text[] NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.installment_rules (duration_months integer PRIMARY KEY, markup_percent numeric NOT NULL);
CREATE TABLE public.plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_name text NOT NULL, slug text NOT NULL UNIQUE, state text NOT NULL, town text NOT NULL,
  size_sqm integer NOT NULL, cash_price integer NOT NULL, plan_summary text, monthly_amount integer, plan_months integer,
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Few left','Sold')),
  documents text[] NOT NULL DEFAULT '{}', images text[] NOT NULL DEFAULT '{}',
  location_description text, landmarks text[] NOT NULL DEFAULT '{}', map_link text,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text NOT NULL, whatsapp text,
  state text NOT NULL, lga text, town text, type text NOT NULL DEFAULT 'Agent', status text NOT NULL DEFAULT 'Approved',
  show_publicly boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, slug text NOT NULL UNIQUE, learn text[] NOT NULL DEFAULT '{}',
  duration text, price integer NOT NULL DEFAULT 0, start_date date, mode text NOT NULL DEFAULT 'In person',
  seats_left integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, business text, state text, quote text NOT NULL,
  photo text, video_url text, category text NOT NULL DEFAULT 'general', approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), image text, video_url text, caption text, category text NOT NULL DEFAULT 'general',
  approved boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), topic text NOT NULL, question text NOT NULL, answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.site_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

-- public-readable tables
GRANT SELECT ON public.products, public.installment_rules, public.plots, public.agents, public.training_courses, public.testimonials, public.gallery, public.faqs, public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.installment_rules, public.plots, public.agents, public.training_courses, public.testimonials, public.gallery, public.faqs, public.site_settings TO authenticated;
GRANT ALL ON public.products, public.installment_rules, public.plots, public.agents, public.training_courses, public.testimonials, public.gallery, public.faqs, public.site_settings TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "public read" ON public.installment_rules FOR SELECT USING (true);
CREATE POLICY "public read" ON public.plots FOR SELECT USING (true);
CREATE POLICY "public read" ON public.agents FOR SELECT USING ((status = 'Approved' AND show_publicly) OR public.is_admin());
CREATE POLICY "public read" ON public.training_courses FOR SELECT USING (active OR public.is_admin());
CREATE POLICY "public read" ON public.testimonials FOR SELECT USING (approved OR public.is_admin());
CREATE POLICY "public read" ON public.gallery FOR SELECT USING (approved OR public.is_admin());
CREATE POLICY "public read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.installment_rules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.plots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.agents FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.training_courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.testimonials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.gallery FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.faqs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin write" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- form tables (public insert only)
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text NOT NULL UNIQUE,
  category text NOT NULL, product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, product_name text NOT NULL,
  price integer NOT NULL CHECK (price > 0), duration integer NOT NULL CHECK (duration BETWEEN 1 AND 60),
  frequency text NOT NULL CHECK (frequency IN ('weekly','monthly')), payment_amount integer,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'), whatsapp text CHECK (whatsapp IS NULL OR whatsapp ~ '^0[789][01][0-9]{8}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 255), state text NOT NULL, lga text NOT NULL CHECK (char_length(lga) <= 100),
  address text NOT NULL CHECK (char_length(address) <= 300), occupation text NOT NULL CHECK (char_length(occupation) <= 120),
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New','Contacted','Approved','Rejected','Completed')),
  notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.land_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'), state text NOT NULL, plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  plot_name text, payment_plan text, visit_date date, message text CHECK (message IS NULL OR char_length(message) <= 1000),
  status text NOT NULL DEFAULT 'New', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'), whatsapp text NOT NULL CHECK (whatsapp ~ '^0[789][01][0-9]{8}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 255), state text NOT NULL, lga text NOT NULL CHECK (char_length(lga) <= 100),
  town text NOT NULL CHECK (char_length(town) <= 100), type text NOT NULL CHECK (type IN ('Agent','Ambassador')),
  occupation text NOT NULL CHECK (char_length(occupation) <= 120), has_shop boolean NOT NULL DEFAULT false,
  note text CHECK (note IS NULL OR char_length(note) <= 1000), consent boolean NOT NULL CHECK (consent),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.training_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL, course_title text NOT NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100), phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 255), state text NOT NULL, education text, experience text CHECK (experience IS NULL OR char_length(experience) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'), topic text NOT NULL, message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 2000),
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.land_inquiries, public.agent_applications, public.training_signups, public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications, public.land_inquiries, public.agent_applications, public.training_signups, public.messages TO authenticated;
GRANT ALL ON public.applications, public.land_inquiries, public.agent_applications, public.training_signups, public.messages TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert" ON public.land_inquiries FOR INSERT TO anon, authenticated WITH CHECK (status = 'New');
CREATE POLICY "public insert" ON public.agent_applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'Pending');
CREATE POLICY "public insert" ON public.training_signups FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public insert" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (is_read = false);
CREATE POLICY "admin all" ON public.applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin all" ON public.land_inquiries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin all" ON public.agent_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin all" ON public.training_signups FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin all" ON public.messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- application submit returns reference
CREATE OR REPLACE FUNCTION public.submit_application(p jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref text; tries int := 0;
BEGIN
  LOOP
    ref := 'SIB-' || to_char(now() AT TIME ZONE 'Africa/Lagos', 'YYYYMMDD') || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM applications WHERE reference = ref);
    tries := tries + 1; IF tries > 20 THEN RAISE EXCEPTION 'could not allocate reference'; END IF;
  END LOOP;
  INSERT INTO applications (reference, category, product_id, product_name, price, duration, frequency, payment_amount,
    full_name, phone, whatsapp, email, state, lga, address, occupation)
  VALUES (ref, p->>'category', NULLIF(p->>'product_id','')::uuid, left(p->>'product_name', 200), (p->>'price')::int, (p->>'duration')::int,
    p->>'frequency', NULLIF(p->>'payment_amount','')::int, trim(p->>'full_name'), p->>'phone', NULLIF(p->>'whatsapp',''), NULLIF(trim(p->>'email'),''),
    p->>'state', trim(p->>'lga'), trim(p->>'address'), trim(p->>'occupation'));
  RETURN ref;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_application(jsonb) TO anon, authenticated;

-- seeds
INSERT INTO public.installment_rules VALUES (3,10),(6,18),(9,25),(12,32),(18,45),(24,58);
INSERT INTO public.site_settings (key, value) VALUES ('company', '{}'::jsonb);

INSERT INTO public.products (category, brand, name, slug, description, cash_price, specs, in_stock, featured, sort_order) VALUES
('solar',NULL,'Small business system','solar-small','For a phone charging point or small kiosk.',850000,'{"Powers":"Lights, fan, 15 phone chargers, POS","Panels":"4 x 450W","Battery":"5kWh lithium","Inverter":"3.5kVA"}',true,true,1),
('solar',NULL,'Medium business system','solar-medium','For a shop with a freezer or a small pure water line.',1650000,'{"Powers":"Freezer, lights, fans, TV, chargers","Panels":"8 x 450W","Battery":"10kWh lithium","Inverter":"5kVA"}',true,true,2),
('solar',NULL,'Large business system','solar-large','For filling stations and pure water factories.',3400000,'{"Powers":"Pump, sealing machine, freezers, lights","Panels":"16 x 450W","Battery":"20kWh lithium","Inverter":"10kVA"}',true,true,3),
('ev',NULL,'E-Bike 72V Rider','e-bike-72v','Electric motorcycle for okada work.',950000,'{"type":"motorcycle","range_km":"80","top_speed_kmh":"65","charging_time":"6 to 7 hours"}',true,true,1),
('ev',NULL,'E-Bike Cargo 60V','e-bike-cargo-60v','Strong rear carrier for small goods.',780000,'{"type":"motorcycle","range_km":"70","top_speed_kmh":"55","charging_time":"6 hours"}',true,false,2),
('ev',NULL,'E-Keke Passenger','e-keke-passenger','Electric tricycle that seats three passengers.',2600000,'{"type":"tricycle","range_km":"100","top_speed_kmh":"50","charging_time":"7 to 8 hours"}',true,true,3),
('ev',NULL,'E-Keke Cargo','e-keke-cargo','Tricycle with a cargo box for traders.',2350000,'{"type":"tricycle","range_km":"90","top_speed_kmh":"45","charging_time":"7 hours"}',false,false,4),
('phones','Samsung','Samsung Galaxy A15','samsung-galaxy-a15','6.5 inch screen, 128GB storage.',185000,'{"Screen":"6.5 inch","Storage":"128GB","RAM":"4GB","Battery":"5000mAh"}',true,true,1),
('phones','Tecno','Tecno Spark 20','tecno-spark-20','Big battery, good camera for the price.',135000,'{"Screen":"6.6 inch","Storage":"128GB","RAM":"8GB","Battery":"5000mAh"}',true,false,2),
('phones','Infinix','Infinix Hot 40i','infinix-hot-40i','Everyday phone with 256GB storage.',150000,'{"Screen":"6.56 inch","Storage":"256GB","RAM":"8GB","Battery":"5000mAh"}',true,false,3),
('phones','Apple','iPhone 12 (UK used)','iphone-12-uk-used','Clean UK used unit, 3 months warranty.',420000,'{"Screen":"6.1 inch","Storage":"128GB","Battery health":"85% and above"}',false,false,4),
('laptops','HP','HP 250 G9 Laptop','hp-250-g9','Core i5, 8GB RAM, 512GB SSD.',520000,'{"Processor":"Intel Core i5","RAM":"8GB","Storage":"512GB SSD","Screen":"15.6 inch"}',true,true,5),
('tablets','Samsung','Samsung Galaxy Tab A9','samsung-tab-a9','8.7 inch tablet for school and work.',210000,'{"Screen":"8.7 inch","Storage":"64GB","RAM":"4GB"}',true,false,6),
('power_banks','Oraimo','Oraimo 27000mAh Power Bank','oraimo-27000','Charges a phone 6 to 7 times.',32000,'{"Capacity":"27000mAh","Ports":"2 USB, 1 Type-C"}',true,false,7),
('accessories','Oraimo','Oraimo FreePods 4','oraimo-freepods-4','Wireless earbuds with noise cancelling.',38000,'{"Battery":"Up to 35 hours with case"}',true,false,8);

INSERT INTO public.plots (estate_name, slug, state, town, size_sqm, cash_price, plan_summary, monthly_amount, plan_months, status, documents, location_description, landmarks, map_link, sort_order) VALUES
('Unguwan Rimi Gardens','unguwan-rimi-gardens-kaduna','Kaduna','Kaduna North',450,2400000,'N115,000 per month for 24 months',115000,24,'Available','{"C of O","Survey Plan"}','Dry land, 5 minutes off the main road. Road and drainage cleared.','{"Rimi Market (1.2km)","Primary school (600m)"}','https://maps.google.com/?q=Kaduna+North',1),
('Kumbotso Layout','kumbotso-layout-kano','Kano','Kumbotso',500,1800000,'N85,000 per month for 24 months',85000,24,'Few left','{"Deed of Assignment","Survey Plan"}','Residential layout with access road. Electricity poles on site.','{"Kano–Zaria road (2km)","Health centre (900m)"}','https://maps.google.com/?q=Kumbotso+Kano',2),
('Lugbe Extension','lugbe-extension-abuja','Abuja FCT','Lugbe',300,4500000,'N210,000 per month for 24 months',210000,24,'Available','{"R of O","Survey Plan","Deed of Assignment"}','Gated site off the airport road.','{"Airport road (3km)","Lugbe market (2km)"}','https://maps.google.com/?q=Lugbe+Abuja',3),
('Bauchi Ring Road Plots','bauchi-ring-road','Bauchi','Bauchi',600,1200000,'N50,000 per month for 24 months',50000,24,'Sold','{"C of O"}','Corner plots along the ring road.','{"Ring road (200m)"}','https://maps.google.com/?q=Bauchi',4);

INSERT INTO public.training_courses (title, slug, learn, duration, price, start_date, seats_left) VALUES
('Solar installation training','solar-installation','{"Sizing a system for a shop or home","Mounting panels safely on roofs","Wiring inverters and batteries","Fault finding and maintenance"}','4 weeks, Monday to Friday',150000,'2026-11-16',12),
('POS business training','pos-business','{"Setting up a POS point","Cash management and float","Avoiding fraud and reversals","Record keeping and profit"}','1 week',35000,'2026-11-09',20);

INSERT INTO public.testimonials (name, business, state, quote, category, approved) VALUES
('Musa Abdullahi','Phone charging business','Kano','I was spending N9,000 on fuel every day. Since the solar was installed in March I have not bought fuel for the shop.','solar',true),
('Hajiya Aisha Bello','Pure water factory','Kaduna','The technicians came on the day they promised. The weekly payment is less than what I used to spend on diesel.','solar',true),
('Ibrahim Sani','Okada rider','Katsina','I charge the bike at home at night. I no longer queue for petrol in the morning.','ev',true),
('Chinedu Okafor','Keke driver','Abuja FCT','The keke is quiet and passengers like it. I pay weekly from what I used to spend on fuel.','ev',true);

INSERT INTO public.agents (name, phone, whatsapp, state, lga, town, type, status, show_publicly) VALUES
('Abubakar Yusuf','08031234567','08031234567','Kano','Nassarawa','Kano','Agent','Approved',true),
('Fatima Garba','08061234567','08061234567','Kaduna','Zaria','Zaria','Agent','Approved',true),
('Emeka Obi','07031234567','07031234567','Abuja FCT','AMAC','Lugbe','Ambassador','Approved',true);

INSERT INTO public.faqs (topic, question, answer, sort_order) VALUES
('Solar','Do I need to pay a deposit?','For most solar systems, no. You start paying after installation. [Review answer]',1),
('Solar','Who owns the system while I am paying?','The company owns it until the last payment. After that it is fully yours. [Review answer]',2),
('Solar','What if something stops working?','Call or WhatsApp us. A technician visits within 48 hours in covered towns. [Review answer]',3),
('Solar','How long does installation take?','Usually one day for small and medium systems, two days for large ones. [Review answer]',4),
('Electric Vehicles','How far can the bike go on one charge?','Between 70km and 100km depending on the model, load and road. [Review answer]',1),
('Electric Vehicles','Where do I charge it?','At home from a normal socket, or at a charging point. Solar charging is possible. [Review answer]',2),
('Electric Vehicles','How long does the battery last?','Lithium batteries usually last 3 to 5 years of daily use. [Review answer]',3),
('Electric Vehicles','Do you provide service?','Yes. Our service centres handle repairs and battery checks. [Review answer]',4),
('Phones and Gadgets','Are the phones new?','Yes, unless the listing says UK used. Every phone comes with a warranty. [Review answer]',1),
('Phones and Gadgets','When do I get the phone?','After your application is approved and the first payment is made. [Review answer]',2),
('Phones and Gadgets','Can I pay off early?','Yes. You can pay the balance at any time. [Review answer]',3),
('Phones and Gadgets','What happens if the phone develops a fault?','Bring it to our office within the warranty period. [Review answer]',4),
('Land and Estate','Can I see the documents before paying?','Yes. We show you every document before you pay anything. [Review answer]',1),
('Land and Estate','Can I visit the site first?','Yes. Book a free site visit from the land page. [Review answer]',2),
('Land and Estate','When do I get allocation?','Allocation is done after the agreed part of the payment is made. [Review answer]',3),
('Land and Estate','Can I build before I finish paying?','Not until full payment and handover. [Review answer]',4),
('Payments and Plans','How do I make payments?','By bank transfer to the company account only. Never to a personal account. [Review answer]',1),
('Payments and Plans','What if I miss a payment?','Call us before the date. We will agree a new date with you. [Review answer]',2),
('Payments and Plans','Are there hidden fees?','No. The full price and every payment is shown before you sign. [Review answer]',3),
('Payments and Plans','Will you ask for my BVN or PIN online?','No. We never ask for your PIN, password or OTP. [Review answer]',4),
('Agents','How do agents earn?','Agents earn a commission on every completed sale in their area. [Review answer]',1),
('Agents','Do I need a shop?','No, but it helps. Ambassadors only need to refer customers. [Review answer]',2),
('Agents','Is there a registration fee?','No. Registration is free. [Review answer]',3),
('Agents','How long does approval take?','Usually within 7 working days. [Review answer]',4);
