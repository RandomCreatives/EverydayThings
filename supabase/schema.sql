create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  cover_image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.photographs (
  id uuid primary key default gen_random_uuid(),
  image_code text not null unique,
  image_url text not null,
  aspect_ratio numeric not null check (aspect_ratio > 0),
  title text not null,
  location text not null,
  category text not null,
  is_print_available boolean not null default true,
  price_tier_id text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists photographs_created_at_idx on public.photographs(created_at desc);
create index if not exists photographs_project_id_idx on public.photographs(project_id);
create index if not exists photographs_image_code_idx on public.photographs(image_code);

alter table public.projects enable row level security;
alter table public.photographs enable row level security;

create policy "Public projects are readable" on public.projects for select using (true);
create policy "Public photographs are readable" on public.photographs for select using (true);
