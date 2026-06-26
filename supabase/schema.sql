-- Supabase setup for Mezzo Maths Ltd Administrative App
-- Run this in Supabase Dashboard → SQL Editor → New query.

create table if not exists public.app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

-- Required for realtime update notifications to include full row data.
alter table public.app_data replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.app_data;
exception
  when duplicate_object then null;
end $$;

-- Storage bucket for country documents and company files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mezzo-admin-documents', 'mezzo-admin-documents', false, 15728640, null)
on conflict (id) do update
set public = false,
    file_size_limit = 15728640,
    allowed_mime_types = null;

drop policy if exists "Authenticated users can read Mezzo admin documents" on storage.objects;
drop policy if exists "Authenticated users can upload Mezzo admin documents" on storage.objects;
drop policy if exists "Authenticated users can update Mezzo admin documents" on storage.objects;
drop policy if exists "Authenticated users can delete Mezzo admin documents" on storage.objects;

create policy "Authenticated users can read Mezzo admin documents"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'mezzo-admin-documents');

create policy "Authenticated users can upload Mezzo admin documents"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'mezzo-admin-documents');

create policy "Authenticated users can update Mezzo admin documents"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'mezzo-admin-documents')
  with check (bucket_id = 'mezzo-admin-documents');

create policy "Authenticated users can delete Mezzo admin documents"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'mezzo-admin-documents');

drop policy if exists "Assigned app users can read app data" on public.app_data;
drop policy if exists "Finance and super admins can update app data" on public.app_data;
drop policy if exists "Super admins can insert app data" on public.app_data;
drop policy if exists "Super admins can delete app data" on public.app_data;
drop policy if exists "Authenticated users can read app data" on public.app_data;
drop policy if exists "Authenticated users can insert app data" on public.app_data;
drop policy if exists "Authenticated users can update app data" on public.app_data;
drop policy if exists "Authenticated users can delete app data" on public.app_data;

create policy "Assigned app users can read app data"
  on public.app_data
  for select
  to authenticated
  using (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
    )
  );

create policy "Finance and super admins can update app data"
  on public.app_data
  for update
  to authenticated
  using (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role in ('Super Admin', 'Finance Admin')
    )
  )
  with check (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role in ('Super Admin', 'Finance Admin')
    )
  );

create policy "Super admins can insert app data"
  on public.app_data
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role = 'Super Admin'
    )
  );

create policy "Super admins can delete app data"
  on public.app_data
  for delete
  to authenticated
  using (
    exists (
      select 1
      from jsonb_to_recordset(data->'users') as u(email text, role text, active boolean)
      where lower(u.email) = lower(auth.jwt()->>'email')
        and u.active = true
        and u.role = 'Super Admin'
    )
  );

insert into public.app_data (id, data, updated_at)
values ('main', '{"settings": {"companyName": "Mezzo Maths Ltd", "appName": "Mezzo Maths Ltd Administrative App", "address": "Accra, Ghana", "phone": "", "email": "", "currency": "GHS", "receiptPrefix": "MMA", "nextReceiptNumber": 2, "openingBankBalance": 0}, "users": [{"id": "user-super-admin", "name": "Super Administrator", "email": "admin@mezzomaths.org", "role": "Super Admin", "active": true, "createdAt": "2026-06-23T00:00:00.000Z"}, {"id": "user-finance-admin", "name": "Finance Administrator", "email": "finance@mezzomaths.org", "role": "Finance Admin", "active": true, "createdAt": "2026-06-23T00:00:00.000Z"}], "schools": [{"id": "school-demo-1", "name": "Demo International School", "location": "Accra", "contactPerson": "Headteacher", "phone": "", "email": "", "term": "Term 1", "academicYear": "2026/2027", "students": 120, "feeType": "per_student", "feePerStudent": 100, "flatRate": 0, "booksBought": 120, "bookUnitPrice": 50, "notes": "Sample record. Delete or edit after deployment.", "createdAt": "2026-06-23T00:00:00.000Z"}], "payments": [{"id": "payment-demo-1", "schoolId": "school-demo-1", "amount": 4500, "datePaid": "2026-06-23", "mode": "MoMo", "reference": "DEMO-MOMO-001", "paidBy": "Demo School Accountant", "receivedBy": "Finance Administrator", "notes": "Sample payment. Delete after deployment.", "receiptNumber": 1, "createdAt": "2026-06-23T00:00:00.000Z"}], "expenses": [{"id": "expense-demo-1", "date": "2026-06-23", "item": "Demo printing expense", "category": "Printing", "quantity": 1, "unitPrice": 750, "paidFrom": "Bank", "recordedBy": "Finance Administrator", "notes": "Sample expense. Delete after deployment.", "createdAt": "2026-06-23T00:00:00.000Z"}], "staff": [{"id": "staff-demo-1", "name": "Demo Staff Member", "role": "Maths Tutor", "department": "Teaching", "staffId": "MM-001", "bankName": "", "bankAccount": "", "basicSalary": 2500, "allowances": 300, "ssnit": 137.5, "tax": 150, "otherDeductions": 0, "month": "June 2026", "paidDate": "2026-06-23", "paymentMode": "Bank Transfer", "notes": "Sample payslip record. Delete or edit after deployment.", "createdAt": "2026-06-23T00:00:00.000Z"}], "countryDocs": [], "companyDocs": []}'::jsonb, now())
on conflict (id) do nothing;
