-- Run this once in Supabase SQL Editor if browser/phone notifications do not arrive
-- from updates made by other admins.

alter table public.app_data replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.app_data;
exception
  when duplicate_object then null;
end $$;
