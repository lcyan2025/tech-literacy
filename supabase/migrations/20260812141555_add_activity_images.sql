alter table public.activities
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.activities
  drop constraint if exists activities_images_array;

alter table public.activities
  add constraint activities_images_array
  check (jsonb_typeof(images) = 'array');
