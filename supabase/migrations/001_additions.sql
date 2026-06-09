-- =====================================================================
-- CARBYN — Schema additions (migration 001)
-- =====================================================================

-- countries table
create table if not exists public.countries (
  code text primary key,
  name_en text not null,
  name_es text not null,
  phone_code text not null,
  flag text
);

-- event_profiles table
create table if not exists public.event_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  event_name text,
  event_date date,
  sport_type text,
  goal text,
  training_hours_per_week numeric,
  created_at timestamptz not null default now()
);

-- training_mixes table
create table if not exists public.training_mixes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  assessment_id uuid references public.assessments(id) on delete set null,
  formula jsonb not null,
  caffeine_per_serving integer,
  carbs_per_serving integer,
  sodium_per_serving integer,
  flavor text,
  created_at timestamptz not null default now()
);

-- race_mixes table
create table if not exists public.race_mixes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  assessment_id uuid references public.assessments(id) on delete set null,
  formula jsonb not null,
  caffeine_per_serving integer,
  carbs_per_serving integer,
  sodium_per_serving integer,
  flavor text,
  event_name text,
  event_date date,
  created_at timestamptz not null default now()
);

-- products table
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text check (type in ('training','race','bundle')),
  base_price numeric(10,2),
  active boolean default true,
  created_at timestamptz not null default now()
);

-- order_items table
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  custom_mix_id uuid references public.custom_mixes(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(10,2),
  mix_type text check (mix_type in ('training','race','bundle'))
);

-- contact_requests table
create table if not exists public.contact_requests (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text,
  phone text,
  message text,
  source text,
  created_at timestamptz not null default now()
);

-- activity_logs table
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Formula defaults config table
create table if not exists public.formula_config (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb not null,
  label text,
  updated_at timestamptz not null default now()
);

-- Carb levels config
insert into public.formula_config (key, value, label) values
  ('carb_levels', '[25,50,75,100,125,150]', 'Available carb levels (g)'),
  ('sodium_levels', '[200,400,600,800,1000]', 'Available sodium levels (mg)'),
  ('caffeine_levels', '[0,25,50,75,100]', 'Available caffeine levels (mg)'),
  ('default_formula', '{"carbsPerServing":75,"sodiumPerServing":600,"caffeinePerServing":50,"ratio":"2:1","flavorStrength":"regular","preservatives":"yes","scooper":"yes"}', 'Default formula values')
on conflict (key) do nothing;

-- Seed a handful of countries
insert into public.countries (code, name_en, name_es, phone_code, flag) values
  ('US', 'United States', 'Estados Unidos', '+1', 'US'),
  ('MX', 'Mexico', 'México', '+52', 'MX'),
  ('EC', 'Ecuador', 'Ecuador', '+593', 'EC'),
  ('ES', 'Spain', 'España', '+34', 'ES'),
  ('GB', 'United Kingdom', 'Reino Unido', '+44', 'GB'),
  ('DE', 'Germany', 'Alemania', '+49', 'DE'),
  ('FR', 'France', 'Francia', '+33', 'FR'),
  ('IT', 'Italy', 'Italia', '+39', 'IT'),
  ('BR', 'Brazil', 'Brasil', '+55', 'BR'),
  ('AR', 'Argentina', 'Argentina', '+54', 'AR'),
  ('CL', 'Chile', 'Chile', '+56', 'CL'),
  ('CO', 'Colombia', 'Colombia', '+57', 'CO'),
  ('PE', 'Peru', 'Perú', '+51', 'PE')
on conflict (code) do nothing;

-- Seed default products
insert into public.products (name, type, base_price, active) values
  ('Training Mix', 'training', 49.00, true),
  ('Race Day Mix', 'race', 59.00, true),
  ('Training + Race Bundle', 'bundle', 99.00, true)
on conflict do nothing;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.countries enable row level security;
alter table public.event_profiles enable row level security;
alter table public.training_mixes enable row level security;
alter table public.race_mixes enable row level security;
alter table public.products enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_requests enable row level security;
alter table public.activity_logs enable row level security;
alter table public.formula_config enable row level security;

create policy "Public can view countries" on public.countries for select using (true);
create policy "Athletes manage own event profiles" on public.event_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Athletes manage own training mixes" on public.training_mixes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Athletes manage own race mixes" on public.race_mixes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public can view products" on public.products for select using (active = true);
create policy "Anyone can submit contact request" on public.contact_requests for insert with check (true);
create policy "Anyone can log activity" on public.activity_logs for insert with check (true);
create policy "Public can view formula config" on public.formula_config for select using (true);
