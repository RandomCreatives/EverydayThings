-- ─────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  description text not null,
  cover_image_url text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Photographs
-- ─────────────────────────────────────────────
create table if not exists public.photographs (
  id               uuid primary key default gen_random_uuid(),
  image_code       text not null unique,
  image_url        text not null,
  aspect_ratio     numeric not null check (aspect_ratio > 0),
  title            text not null,
  description      text,
  location         text not null,
  category         text not null,
  is_print_available boolean not null default true,
  price_tier_id    text,
  project_id       uuid references public.projects(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists photographs_created_at_idx  on public.photographs(created_at desc);
create index if not exists photographs_project_id_idx  on public.photographs(project_id);
create index if not exists photographs_image_code_idx  on public.photographs(image_code);

-- ─────────────────────────────────────────────
-- Print sizes (reference table)
-- ─────────────────────────────────────────────
create table if not exists public.print_sizes (
  id          text primary key,
  label       text not null,
  dimensions  text not null,
  price_birr  numeric not null check (price_birr > 0)
);

insert into public.print_sizes (id, label, dimensions, price_birr) values
  ('small',  'Small',  '30 × 40 cm', 2200),
  ('medium', 'Medium', '45 × 60 cm', 3900),
  ('large',  'Large',  '60 × 90 cm', 6600)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- Orders (Chapa / Telebirr fulfillment)
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  chapa_tx_ref        text not null unique,
  chapa_checkout_url  text,
  photograph_id       uuid references public.photographs(id) on delete set null,
  image_code          text not null,
  print_size_id       text not null,
  amount_birr         numeric not null,
  currency            text not null default 'ETB',
  customer_email      text,
  customer_name       text,
  payment_method      text,          -- e.g. "telebirr", "cbebirr", "mpesa"
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed', 'cancelled')),
  chapa_verified_at   timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists orders_chapa_tx_ref_idx  on public.orders(chapa_tx_ref);
create index if not exists orders_image_code_idx    on public.orders(image_code);
create index if not exists orders_status_idx        on public.orders(status);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table public.projects       enable row level security;
alter table public.photographs    enable row level security;
alter table public.print_sizes    enable row level security;
alter table public.orders         enable row level security;

-- Public read on catalogue data
create policy "Public projects are readable"
  on public.projects for select using (true);

create policy "Public photographs are readable"
  on public.photographs for select using (true);

create policy "Public print sizes are readable"
  on public.print_sizes for select using (true);

-- Orders: insert via service role only (server-side API), no direct client reads
create policy "Service role manages orders"
  on public.orders using (false);  -- blocked for anon; server uses service_role key
