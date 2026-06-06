-- ============================================================================
--  VM Tipping — Supabase database schema
--  Run this ONCE in the Supabase SQL editor (see README.md for steps).
-- ============================================================================

-- 1) The live configuration (one single row, id = 1).
--    Holds teams, matches, knockout rounds, bonus questions and the answer key.
create table if not exists app_config (
  id          integer primary key default 1,
  data        jsonb   not null default '{}'::jsonb,
  answer_key  jsonb   not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

-- 2) One row per person's submission.
create table if not exists entries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  predictions  jsonb not null default '{}'::jsonb,  -- what the player picked
  scores       jsonb not null default '{}'::jsonb,  -- admin's per-answer correctness
  total        integer not null default 0,          -- computed total points
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Security: this is a small private pool with NO real secrets, so we keep it
-- wide open. Row Level Security is DISABLED, which lets the public anon key
-- read and write. If you ever want to lock it down, see the commented policies.
-- ----------------------------------------------------------------------------
alter table app_config disable row level security;
alter table entries    disable row level security;

-- Seed the singleton config row so it always exists.
insert into app_config (id, data, answer_key)
values (1, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- ---- Optional stricter setup (leave commented unless you need it) -----------
-- alter table entries enable row level security;
-- create policy "anyone can read entries"   on entries for select using (true);
-- create policy "anyone can insert entries" on entries for insert with check (true);
-- create policy "anyone can update entries" on entries for update using (true);
