-- =====================================================================
-- CARBYN — Personalized Endurance Fuel Platform
-- Supabase / PostgreSQL schema (MVP)
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- USERS
-- Mirrors auth.users (Supabase Auth) with app-level profile fields.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  locale text default 'en' check (locale in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ATHLETE PROFILES
-- The durable physiological / performance profile, refreshed by
-- assessments and follow-up surveys over time.
-- ---------------------------------------------------------------------
create table if not exists public.athlete_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  sport_type text check (sport_type in ('marathon','ironman','triathlon','cycling','ultra','trail','other')),
  goal text check (goal in ('race','training','both')),
  training_hours_per_week numeric,
  event_name text,
  event_date date,
  caffeine_tolerance text check (caffeine_tolerance in ('none','low','medium','high')),
  caffeine_consumption text check (caffeine_consumption in ('none','occasional','daily','heavy')),
  sweat_rate text check (sweat_rate in ('low','medium','high')),
  hot_climate_training boolean,
  sodium_issues boolean,
  digestive_issues boolean,
  fructose_tolerance text check (fructose_tolerance in ('low','normal','high')),
  sugar_sensitivity boolean,
  diabetes boolean,
  preferred_sweetness text check (preferred_sweetness in ('light','regular','intense')),
  flavor_preferences text[],
  current_nutrition_strategy text,
  carb_target_per_hour numeric,
  past_issues_with_gels boolean,
  past_issues_with_sports_drinks boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_profiles_user_id_idx on public.athlete_profiles (user_id);

-- ---------------------------------------------------------------------
-- ASSESSMENTS
-- One row per completed (or in-progress) assessment submission.
-- Raw answers stored as JSONB so the dynamic question flow can evolve
-- without migrations on every new question.
-- ---------------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  answers jsonb not null,
  completed boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_id_idx on public.assessments (user_id);
create index if not exists assessments_email_idx on public.assessments (email);
create index if not exists assessments_answers_gin on public.assessments using gin (answers);

-- ---------------------------------------------------------------------
-- RECOMMENDATIONS
-- The engine-generated starting formula + AI reasoning for a given
-- assessment. Immutable snapshot — edits live in custom_mixes.
-- ---------------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  formula jsonb not null,            -- { carbsPerServing, sodiumPerServing, caffeinePerServing, ratio, flavor, ... }
  reasoning jsonb,                   -- structured AI explanation entries (bilingual)
  pack_recommendation jsonb,         -- suggested servings / bundle guidance
  model text default 'rules-engine-v1',
  created_at timestamptz not null default now()
);

create index if not exists recommendations_assessment_id_idx on public.recommendations (assessment_id);

-- ---------------------------------------------------------------------
-- CUSTOM MIXES
-- The athlete's editable, ordered formula — what actually gets produced
-- and shipped. Tracks deviation from the original recommendation.
-- ---------------------------------------------------------------------
create table if not exists public.custom_mixes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete set null,
  recommendation_id uuid references public.recommendations (id) on delete set null,
  athlete_name text not null,
  package_label text not null,
  motivational_message jsonb,         -- { en, es }
  flavor text,
  flavor_strength text check (flavor_strength in ('lite','regular','mega')),
  carbs_per_serving integer check (carbs_per_serving in (25,50,75,100,125,150)),
  sodium_per_serving integer check (sodium_per_serving in (200,400,600,800,1000)),
  malto_fructose_ratio text check (malto_fructose_ratio in ('1:0.8','2:1')),
  caffeine_per_serving integer check (caffeine_per_serving in (0,25,50,75,100)),
  preservatives boolean default true,
  scooper boolean default true,
  notes text,
  deviated_from_recommendation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_mixes_user_id_idx on public.custom_mixes (user_id);

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete set null,
  custom_mix_id uuid references public.custom_mixes (id) on delete set null,
  servings integer not null,
  bundle_race_formula boolean not null default false,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  total_amount numeric(10,2),
  currency text default 'USD',
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

-- ---------------------------------------------------------------------
-- FEEDBACK SURVEYS
-- Post-purchase feedback loop, used to refine future recommendations.
-- ---------------------------------------------------------------------
create table if not exists public.feedback_surveys (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  energy_level integer check (energy_level between 1 and 5),
  gi_comfort integer check (gi_comfort between 1 and 5),
  taste_rating integer check (taste_rating between 1 and 5),
  sodium_adequacy integer check (sodium_adequacy between 1 and 5),
  caffeine_effectiveness integer check (caffeine_effectiveness between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_surveys_order_id_idx on public.feedback_surveys (order_id);

-- ---------------------------------------------------------------------
-- FLAVORS
-- Admin-manageable catalog backing the assessment & mix editor options.
-- ---------------------------------------------------------------------
create table if not exists public.flavors (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,             -- e.g. 'blue_raspberry'
  label_en text not null,
  label_es text not null,
  natural boolean default false,
  active boolean default true,
  sort_order integer default 0
);

-- ---------------------------------------------------------------------
-- ADMIN USERS
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key references public.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','support','analyst')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ANALYTICS EVENTS
-- Lightweight event log for funnel analysis (assessment starts/steps,
-- formula generated, edits, orders, etc).
-- ---------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete set null,
  session_id text,
  event_name text not null,             -- e.g. 'assessment_started', 'formula_generated', 'mix_edited', 'order_placed'
  properties jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.users enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.recommendations enable row level security;
alter table public.custom_mixes enable row level security;
alter table public.orders enable row level security;
alter table public.feedback_surveys enable row level security;
alter table public.flavors enable row level security;
alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;

-- Users can read/update their own row
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Athlete profiles: owner access
create policy "Athletes manage own profile" on public.athlete_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Assessments: anyone can insert (pre-auth funnel); owners can read their own
create policy "Anyone can submit an assessment" on public.assessments
  for insert with check (true);
create policy "Users can view own assessments" on public.assessments
  for select using (auth.uid() = user_id or user_id is null);

-- Recommendations follow assessment ownership (read-only to athletes)
create policy "Users can view recommendations for their assessments" on public.recommendations
  for select using (
    exists (
      select 1 from public.assessments a
      where a.id = recommendations.assessment_id
        and (a.user_id = auth.uid() or a.user_id is null)
    )
  );

-- Custom mixes: owner manages
create policy "Athletes manage own custom mixes" on public.custom_mixes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders: owner manages
create policy "Athletes manage own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Feedback: owner manages
create policy "Athletes manage own feedback" on public.feedback_surveys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Flavors: public read
create policy "Anyone can view active flavors" on public.flavors
  for select using (active = true);

-- Admin-only tables
create policy "Admins can view admin_users" on public.admin_users
  for select using (
    exists (select 1 from public.admin_users au where au.id = auth.uid())
  );

create policy "Admins can view analytics" on public.analytics_events
  for select using (
    exists (select 1 from public.admin_users au where au.id = auth.uid())
  );
create policy "Anyone can log analytics events" on public.analytics_events
  for insert with check (true);

-- Admins can view everything across athlete-facing tables (read access for the portal)
create policy "Admins can view all assessments" on public.assessments
  for select using (exists (select 1 from public.admin_users au where au.id = auth.uid()));
create policy "Admins can view all recommendations" on public.recommendations
  for select using (exists (select 1 from public.admin_users au where au.id = auth.uid()));
create policy "Admins can view all custom mixes" on public.custom_mixes
  for select using (exists (select 1 from public.admin_users au where au.id = auth.uid()));
create policy "Admins can view all orders" on public.orders
  for select using (exists (select 1 from public.admin_users au where au.id = auth.uid()));
create policy "Admins can view all feedback" on public.feedback_surveys
  for select using (exists (select 1 from public.admin_users au where au.id = auth.uid()));
create policy "Admins manage flavors" on public.flavors
  for all using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

-- =====================================================================
-- SEED: Flavor catalog (matches the assessment & mix editor options)
-- =====================================================================
insert into public.flavors (key, label_en, label_es, natural, sort_order) values
  ('unflavored', 'Unflavored', 'Sin sabor', false, 1),
  ('blue_raspberry', 'Blue Raspberry', 'Blue Raspberry', false, 2),
  ('lemon_lime', 'Lemon Lime', 'Lemon Lime', false, 3),
  ('cherry', 'Cherry', 'Cereza', false, 4),
  ('pineapple', 'Pineapple', 'Piña', false, 5),
  ('kiwi', 'Kiwi', 'Kiwi', false, 6),
  ('watermelon', 'Watermelon', 'Sandía', false, 7),
  ('root_beer', 'Root Beer', 'Root Beer', false, 8),
  ('grape', 'Grape', 'Uva', false, 9),
  ('green_apple', 'Green Apple', 'Manzana Verde', false, 10),
  ('mixed_berry', 'Mixed Berry', 'Mezcla de Bayas', false, 11),
  ('peach', 'Peach', 'Durazno', false, 12),
  ('tangerine_natural', 'Tangerine (All Natural)', 'Mandarina (Natural)', true, 13),
  ('mango_natural', 'Mango (All Natural)', 'Mango (Natural)', true, 14),
  ('cotton_candy_natural', 'Cotton Candy (All Natural)', 'Algodón de Azúcar (Natural)', true, 15)
on conflict (key) do nothing;
