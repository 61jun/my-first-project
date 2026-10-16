-- 在 Supabase SQL Editor 中执行。只有登录用户能访问自己的记录。
create table if not exists public.life_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.life_records enable row level security;
create policy "Read own life records" on public.life_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own life records" on public.life_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own life records" on public.life_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
