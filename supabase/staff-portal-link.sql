-- Staff Portal Link Tables for Mezzo Admin App
-- Run this in Supabase SQL Editor before using the Staff Portal Link sync button.

create table if not exists public.staff_portal_profiles (
  staff_key text primary key,
  staff_id text,
  email text,
  name text not null,
  role text,
  phone text,
  momo_number text,
  payment_mode text,
  assigned_school_id text,
  assigned_school_name text,
  default_salary numeric default 0,
  loan_balance numeric default 0,
  profile_data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.staff_portal_salary_records (
  id text primary key,
  staff_key text references public.staff_portal_profiles(staff_key) on delete cascade,
  staff_id text,
  email text,
  staff_name text,
  month text,
  amount numeric default 0,
  paid_by text,
  school_id text,
  payment_mode text,
  pay_number text,
  record_data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.staff_portal_profiles enable row level security;
alter table public.staff_portal_salary_records enable row level security;

create or replace function public.is_mezzo_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_data
    where id = 'main'
      and exists (
        select 1
        from jsonb_array_elements(data->'users') as user_row
        where lower(user_row->>'email') = lower(auth.jwt()->>'email')
          and coalesce((user_row->>'active')::boolean, true) = true
          and (user_row->>'role') in ('Super Admin', 'Finance Admin', 'CEO', 'HR/Marketing')
      )
  );
$$;

drop policy if exists "Admins manage staff portal profiles" on public.staff_portal_profiles;
create policy "Admins manage staff portal profiles"
on public.staff_portal_profiles
for all
to authenticated
using (public.is_mezzo_admin_user())
with check (public.is_mezzo_admin_user());

drop policy if exists "Staff read own profile" on public.staff_portal_profiles;
create policy "Staff read own profile"
on public.staff_portal_profiles
for select
to authenticated
using (lower(email) = lower(auth.jwt()->>'email') or public.is_mezzo_admin_user());

drop policy if exists "Admins manage staff portal salaries" on public.staff_portal_salary_records;
create policy "Admins manage staff portal salaries"
on public.staff_portal_salary_records
for all
to authenticated
using (public.is_mezzo_admin_user())
with check (public.is_mezzo_admin_user());

drop policy if exists "Staff read own salary records" on public.staff_portal_salary_records;
create policy "Staff read own salary records"
on public.staff_portal_salary_records
for select
to authenticated
using (lower(email) = lower(auth.jwt()->>'email') or public.is_mezzo_admin_user());

create index if not exists staff_portal_profiles_email_idx on public.staff_portal_profiles (lower(email));
create index if not exists staff_portal_salary_email_idx on public.staff_portal_salary_records (lower(email));
create index if not exists staff_portal_salary_staff_key_idx on public.staff_portal_salary_records (staff_key);
