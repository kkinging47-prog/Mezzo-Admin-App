-- Run this in Supabase SQL Editor after adding CEO or HR/Marketing app users.
-- It allows CEO and HR/Marketing roles to save app changes such as invoices, salaries, school data, country updates, and company documents.

drop policy if exists "Finance and super admins can update app data" on public.app_data;

create policy "Finance CEO HR and super admins can update app data"
  on public.app_data
  for update
  to authenticated
  using (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role in ('Super Admin', 'Finance Admin', 'CEO', 'HR/Marketing')
    )
  )
  with check (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role in ('Super Admin', 'Finance Admin', 'CEO', 'HR/Marketing')
    )
  );
