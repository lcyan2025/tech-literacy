create extension if not exists "pgcrypto";

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  route_path text not null unique,
  page_name text not null default '',
  legacy_id text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  section_type text not null check (
    section_type in (
      'Article',
      'Announcement',
      'IntroCard',
      'MeetTheTeam',
      'MindMap',
      'QuickLinkCard',
      'Timeline'
    )
  ),
  name text not null default '',
  title text not null default '',
  description text not null default '',
  image_url text,
  image_name text,
  legacy_id text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_type, name)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.content_sections(id) on delete cascade,
  parent_id uuid references public.content_items(id) on delete cascade,
  name text not null default '',
  title text not null default '',
  description text not null default '',
  link text not null default '',
  date date,
  image_url text,
  image_name text,
  legacy_id text,
  bg_class text,
  shadow_class text,
  position text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  title text not null default '',
  credits text not null default '',
  course_type text not null default '',
  year text not null default '',
  category text not null default '',
  notes text not null default '',
  main_image_url text,
  main_image_name text,
  goals text not null default '',
  outline text not null default '',
  assessment text not null default '',
  schedule text not null default '',
  references_text text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  legacy_id text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expertise_records (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  category text not null default '',
  legacy_id text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  activity_type text not null default '',
  link text not null default '',
  image_url text,
  image_name text,
  legacy_id text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  route_path text not null default '',
  name text not null default '',
  email text,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  file_name text not null default '',
  alt_text text not null default '',
  mime_type text not null default '',
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists content_sections_page_sort_idx
  on public.content_sections(page_id, sort_order);
create index if not exists content_items_section_parent_sort_idx
  on public.content_items(section_id, parent_id, sort_order);
create index if not exists courses_sort_idx
  on public.courses(sort_order);
create index if not exists expertise_sort_idx
  on public.expertise_records(sort_order);
create index if not exists activities_sort_idx
  on public.activities(sort_order);
create index if not exists comments_status_created_idx
  on public.comments(status, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and is_active = true
  );
$$;

alter table public.site_pages enable row level security;
alter table public.content_sections enable row level security;
alter table public.content_items enable row level security;
alter table public.courses enable row level security;
alter table public.expertise_records enable row level security;
alter table public.activities enable row level security;
alter table public.comments enable row level security;
alter table public.media_assets enable row level security;
alter table public.admin_profiles enable row level security;

create policy "public read published pages"
  on public.site_pages for select
  using (is_published = true or public.is_admin());

create policy "admins manage pages"
  on public.site_pages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public read published sections"
  on public.content_sections for select
  using (is_published = true or public.is_admin());

create policy "admins manage sections"
  on public.content_sections for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public read published items"
  on public.content_items for select
  using (is_published = true or public.is_admin());

create policy "admins manage items"
  on public.content_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public read published courses"
  on public.courses for select
  using (is_published = true or public.is_admin());

create policy "admins manage courses"
  on public.courses for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public read published expertise"
  on public.expertise_records for select
  using (is_published = true or public.is_admin());

create policy "admins manage expertise"
  on public.expertise_records for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public read published activities"
  on public.activities for select
  using (is_published = true or public.is_admin());

create policy "admins manage activities"
  on public.activities for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public submit pending comments"
  on public.comments for insert
  with check (status = 'pending');

create policy "admins read and manage comments"
  on public.comments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage media metadata"
  on public.media_assets for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins read profiles"
  on public.admin_profiles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "admins manage profiles"
  on public.admin_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "public read site media"
  on storage.objects for select
  using (bucket_id = 'site-media');

create policy "admins upload site media"
  on storage.objects for insert
  with check (bucket_id = 'site-media' and public.is_admin());

create policy "admins update site media"
  on storage.objects for update
  using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());

create policy "admins delete site media"
  on storage.objects for delete
  using (bucket_id = 'site-media' and public.is_admin());
