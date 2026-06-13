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
  tx_ref              text not null unique,
  provider            text not null default 'chapa_telebirr',
  photograph_id       uuid references public.photographs(id) on delete set null,
  image_code          text not null,
  size_id             text not null,
  print_dimensions    text,
  customer_name       text not null,
  customer_email      text not null,
  customer_phone      text not null,
  delivery_address    text not null,
  amount_etb          numeric not null,
  currency            text not null default 'ETB' check (currency = 'ETB'),
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  fulfillment_status  text not null default 'pending'
                        check (fulfillment_status in ('pending', 'printing', 'shipped', 'delivered', 'cancelled')),
  receipt_url         text,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists orders_tx_ref_idx           on public.orders(tx_ref);
create index if not exists orders_image_code_idx       on public.orders(image_code);
create index if not exists orders_payment_status_idx   on public.orders(payment_status);
create index if not exists orders_customer_email_idx   on public.orders(customer_email);

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

-- ─────────────────────────────────────────────
-- Storage bucket for photographs
-- Run this in Supabase Dashboard → SQL Editor
-- OR create the bucket manually:
--   Dashboard → Storage → New bucket
--   Name: photographs   Public: ON
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photographs', 'photographs', true)
on conflict (id) do nothing;

-- Allow public read of all images
create policy "Public photograph images are readable"
  on storage.objects for select
  using (bucket_id = 'photographs');

-- Only service role can upload (enforced by API route auth)
create policy "Service role uploads photographs"
  on storage.objects for insert
  with check (bucket_id = 'photographs');

-- ─────────────────────────────────────────────
-- Storage bucket for PDF receipts (private)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;
