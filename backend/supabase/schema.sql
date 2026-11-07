-- Run once in your own Supabase SQL editor. This script retains existing rows.
create table if not exists public.datasets (
  id text primary key,
  title text not null,
  active_sha256 text not null,
  source jsonb,
  classification text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.dataset_versions (
  dataset_id text not null references public.datasets(id),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  object_path text not null,
  metadata jsonb not null,
  published_at timestamptz not null default now(),
  primary key (dataset_id, sha256)
);
create table if not exists public.dataset_packs (
  version text primary key,
  manifest jsonb not null,
  published_at timestamptz not null default now()
);
create table if not exists public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dataset_version text references public.dataset_packs(version),
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.datasets enable row level security;
alter table public.dataset_versions enable row level security;
alter table public.dataset_packs enable row level security;
alter table public.player_progress enable row level security;
revoke all on public.datasets, public.dataset_versions, public.dataset_packs, public.player_progress from anon, authenticated;
grant select on public.datasets, public.dataset_versions, public.dataset_packs to anon, authenticated;
grant select, insert, update on public.player_progress to authenticated;
grant all on public.datasets, public.dataset_versions, public.dataset_packs, public.player_progress to service_role;
drop policy if exists "Published datasets are readable" on public.datasets;
create policy "Published datasets are readable" on public.datasets for select to anon, authenticated using (true);
drop policy if exists "Published versions are readable" on public.dataset_versions;
create policy "Published versions are readable" on public.dataset_versions for select to anon, authenticated using (true);
drop policy if exists "Published packs are readable" on public.dataset_packs;
create policy "Published packs are readable" on public.dataset_packs for select to anon, authenticated using (true);
drop policy if exists "Read own progress" on public.player_progress;
create policy "Read own progress" on public.player_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own progress" on public.player_progress;
create policy "Insert own progress" on public.player_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own progress" on public.player_progress;
create policy "Update own progress" on public.player_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Public prepared game assets; only the server-side publisher writes them.
insert into storage.buckets (id, name, public)
values ('luna-datasets', 'luna-datasets', true)
on conflict (id) do nothing;
