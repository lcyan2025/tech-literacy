create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
revoke create on schema public from public, anon, authenticated;

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
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'spam')
  ),
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
create index if not exists content_items_parent_idx
  on public.content_items(parent_id);
create index if not exists courses_sort_idx
  on public.courses(sort_order);
create index if not exists expertise_sort_idx
  on public.expertise_records(sort_order);
create index if not exists activities_sort_idx
  on public.activities(sort_order);
create index if not exists comments_status_created_idx
  on public.comments(status, created_at desc);
create index if not exists media_assets_created_by_idx
  on public.media_assets(created_by);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = (select auth.uid())
      and is_active = true
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.site_pages enable row level security;
alter table public.content_sections enable row level security;
alter table public.content_items enable row level security;
alter table public.courses enable row level security;
alter table public.expertise_records enable row level security;
alter table public.activities enable row level security;
alter table public.comments enable row level security;
alter table public.media_assets enable row level security;
alter table public.admin_profiles enable row level security;

create policy "anonymous read published pages"
  on public.site_pages for select to anon
  using (is_published = true);
create policy "authenticated read published or admin pages"
  on public.site_pages for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert pages"
  on public.site_pages for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update pages"
  on public.site_pages for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete pages"
  on public.site_pages for delete to authenticated
  using ((select private.is_admin()));

create policy "anonymous read published sections"
  on public.content_sections for select to anon
  using (is_published = true);
create policy "authenticated read published or admin sections"
  on public.content_sections for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert sections"
  on public.content_sections for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update sections"
  on public.content_sections for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete sections"
  on public.content_sections for delete to authenticated
  using ((select private.is_admin()));

create policy "anonymous read published items"
  on public.content_items for select to anon
  using (is_published = true);
create policy "authenticated read published or admin items"
  on public.content_items for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert items"
  on public.content_items for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update items"
  on public.content_items for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete items"
  on public.content_items for delete to authenticated
  using ((select private.is_admin()));

create policy "anonymous read published courses"
  on public.courses for select to anon
  using (is_published = true);
create policy "authenticated read published or admin courses"
  on public.courses for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert courses"
  on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update courses"
  on public.courses for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete courses"
  on public.courses for delete to authenticated
  using ((select private.is_admin()));

create policy "anonymous read published expertise"
  on public.expertise_records for select to anon
  using (is_published = true);
create policy "authenticated read published or admin expertise"
  on public.expertise_records for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert expertise"
  on public.expertise_records for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update expertise"
  on public.expertise_records for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete expertise"
  on public.expertise_records for delete to authenticated
  using ((select private.is_admin()));

create policy "anonymous read published activities"
  on public.activities for select to anon
  using (is_published = true);
create policy "authenticated read published or admin activities"
  on public.activities for select to authenticated
  using (is_published = true or (select private.is_admin()));
create policy "admins insert activities"
  on public.activities for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update activities"
  on public.activities for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete activities"
  on public.activities for delete to authenticated
  using ((select private.is_admin()));

create policy "visitors submit pending comments"
  on public.comments for insert to anon, authenticated
  with check (status = 'pending');
create policy "admins read comments"
  on public.comments for select to authenticated
  using ((select private.is_admin()));
create policy "admins update comments"
  on public.comments for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete comments"
  on public.comments for delete to authenticated
  using ((select private.is_admin()));

create policy "admins read media metadata"
  on public.media_assets for select to authenticated
  using ((select private.is_admin()));
create policy "admins insert media metadata"
  on public.media_assets for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update media metadata"
  on public.media_assets for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete media metadata"
  on public.media_assets for delete to authenticated
  using ((select private.is_admin()));

create policy "users read own profile or admins read profiles"
  on public.admin_profiles for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy "admins insert profiles"
  on public.admin_profiles for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins update profiles"
  on public.admin_profiles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "admins delete profiles"
  on public.admin_profiles for delete to authenticated
  using ((select private.is_admin()));

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke all privileges on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table
  public.site_pages,
  public.content_sections,
  public.content_items,
  public.courses,
  public.expertise_records,
  public.activities
to anon;

grant insert on table public.comments to anon;

grant select, insert, update, delete on all tables in schema public
  to authenticated;

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke all on functions from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = excluded.public;

create policy "public read site media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');
create policy "admins upload site media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (select private.is_admin())
  );
create policy "admins update site media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'site-media'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'site-media'
    and (select private.is_admin())
  );
create policy "admins delete site media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and (select private.is_admin())
  );
