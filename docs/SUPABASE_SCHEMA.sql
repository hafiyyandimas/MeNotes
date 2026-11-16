-- MeNote database schema
-- Run in the Supabase SQL Editor.
-- This script uses Supabase Auth anonymous users and RLS.
-- Never expose the Supabase service_role key in the client.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  image_paths text[] not null default '{}',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_length check (char_length(title) <= 160),
  constraint notes_content_length check (char_length(content) <= 100000)
);

create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);

create index if not exists notes_user_pin_sort_idx
  on public.notes (user_id, is_pinned desc, sort_order asc, updated_at desc);

create index if not exists notes_tags_gin_idx
  on public.notes using gin (tags);

-- Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.notes enable row level security;

 drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
  on public.notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

 drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes"
  on public.notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

 drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
  on public.notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

 drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------
-- Private Storage bucket for note images
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object names must begin with: <auth.uid>/<note_id>/<file>
 drop policy if exists "Users can read their own note images" on storage.objects;
create policy "Users can read their own note images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

 drop policy if exists "Users can upload their own note images" on storage.objects;
create policy "Users can upload their own note images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

 drop policy if exists "Users can update their own note images" on storage.objects;
create policy "Users can update their own note images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

 drop policy if exists "Users can delete their own note images" on storage.objects;
create policy "Users can delete their own note images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
