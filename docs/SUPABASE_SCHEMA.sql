-- MeNote database schema
-- Run in the Supabase SQL Editor.
-- This script uses Supabase Auth anonymous users and RLS.
-- Never expose the Supabase service_role key in the client.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Shared note sessions
-- ------------------------------------------------------------------
create table if not exists public.note_sessions (
  id text primary key,
  passphrase_hash text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint note_sessions_id_length check (char_length(id) between 3 and 64)
);

create table if not exists public.note_session_members (
  session_id text not null references public.note_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.note_sessions enable row level security;
alter table public.note_session_members enable row level security;

revoke all on public.note_sessions from anon, authenticated;
revoke all on public.note_session_members from anon, authenticated;

create or replace function public.has_note_session_access(target_session_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.note_session_members member
    where member.session_id = target_session_id
      and member.user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_note_session_access(text) from public, anon;
grant execute on function public.has_note_session_access(text) to authenticated;

create or replace function public.open_note_session(p_session_id text, p_passphrase text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_id text := lower(btrim(p_session_id));
  stored_hash text;
begin
  if auth.uid() is null then
    raise exception 'Sign in is required to open a shared session.';
  end if;
  if normalized_id is null or char_length(normalized_id) not between 3 and 64
     or normalized_id !~ '^[a-z0-9 ._-]+$' then
    raise exception 'Session ID must be 3 to 64 characters using letters, numbers, spaces, dots, underscores, or hyphens.';
  end if;
  if p_passphrase is null or char_length(p_passphrase) not between 10 and 72
     or octet_length(p_passphrase) > 72 then
    raise exception 'Passphrase must be 10 to 72 characters and at most 72 bytes.';
  end if;

  select session.passphrase_hash into stored_hash
  from public.note_sessions session
  where session.id = normalized_id
  for update;

  if not found then
    insert into public.note_sessions (id, passphrase_hash, created_by)
    values (normalized_id, crypt(p_passphrase, gen_salt('bf', 12)), auth.uid())
    on conflict (id) do nothing;

    select session.passphrase_hash into stored_hash
    from public.note_sessions session
    where session.id = normalized_id
    for update;
  end if;

  if crypt(p_passphrase, stored_hash) <> stored_hash then
    raise exception 'Session ID or passphrase is incorrect.';
  end if;

  insert into public.note_session_members (session_id, user_id)
  values (normalized_id, auth.uid())
  on conflict (session_id, user_id) do nothing;

  return normalized_id;
end;
$$;

revoke all on function public.open_note_session(text, text) from public, anon;
grant execute on function public.open_note_session(text, text) to authenticated;

-- ------------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text references public.note_sessions (id) on delete cascade,
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

alter table public.notes add column if not exists session_id text;

do $$
begin
  alter table public.notes
    add constraint notes_session_id_fkey
    foreign key (session_id) references public.note_sessions (id) on delete cascade;
exception
  when duplicate_object then null;
end;
$$;

create index if not exists notes_session_updated_idx
  on public.notes (session_id, updated_at desc);

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
 drop policy if exists "Session members can read notes" on public.notes;
 drop policy if exists "Session members can create notes" on public.notes;
 drop policy if exists "Session members can update notes" on public.notes;
 drop policy if exists "Session members can delete notes" on public.notes;
create policy "Users can read their own notes"
  on public.notes for select
  to authenticated
  using (
    (session_id is null and (select auth.uid()) = user_id)
    or (session_id is not null and public.has_note_session_access(session_id))
  );

 drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes"
  on public.notes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (session_id is null or public.has_note_session_access(session_id))
  );

 drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
  on public.notes for update
  to authenticated
  using (
    (session_id is null and (select auth.uid()) = user_id)
    or (session_id is not null and public.has_note_session_access(session_id))
  )
  with check (
    (session_id is null and (select auth.uid()) = user_id)
    or (session_id is not null and public.has_note_session_access(session_id))
  );

 drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete
  to authenticated
  using (
    (session_id is null and (select auth.uid()) = user_id)
    or (session_id is not null and public.has_note_session_access(session_id))
  );

grant select, insert, update, delete on public.notes to authenticated;

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

-- Object names begin with <auth.uid>/<note_id>/<file> for personal notes,
-- or <session_id>/<note_id>/<file> for shared sessions.
 drop policy if exists "Users can read their own note images" on storage.objects;
create policy "Users can read their own note images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'note-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_note_session_access((storage.foldername(name))[1])
    )
  );

 drop policy if exists "Users can upload their own note images" on storage.objects;
create policy "Users can upload their own note images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'note-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_note_session_access((storage.foldername(name))[1])
    )
  );

 drop policy if exists "Users can update their own note images" on storage.objects;
create policy "Users can update their own note images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'note-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_note_session_access((storage.foldername(name))[1])
    )
  )
  with check (
    bucket_id = 'note-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_note_session_access((storage.foldername(name))[1])
    )
  );

 drop policy if exists "Users can delete their own note images" on storage.objects;
create policy "Users can delete their own note images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'note-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_note_session_access((storage.foldername(name))[1])
    )
  );
