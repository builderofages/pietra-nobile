-- ==========================================================
-- PIETRA NOBILE — Backend schema (plug-and-play)
-- Run this in any Supabase project's SQL editor, then paste
-- the Project URL + anon key into js/config.js. Done.
-- ==========================================================

create table if not exists public.pn_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  interest text,
  budget text,
  message text,
  status text not null default 'new',
  notes text
);

create table if not exists public.pn_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inquiry_id uuid references public.pn_inquiries(id),
  customer_name text not null,
  email text,
  phone text,
  item text not null,
  description text,
  amount numeric(12,2),
  deposit_paid boolean not null default false,
  status text not null default 'deposit_pending',
  notes text
);

create table if not exists public.pn_staff (
  email text primary key
);

alter table public.pn_inquiries enable row level security;
alter table public.pn_orders enable row level security;
alter table public.pn_staff enable row level security;

create or replace function public.pn_is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.pn_staff where lower(email) = lower(coalesce(auth.jwt()->>'email',''))) $$;

create policy "public can submit inquiries" on public.pn_inquiries for insert to anon, authenticated with check (true);
create policy "staff read inquiries" on public.pn_inquiries for select to authenticated using (public.pn_is_staff());
create policy "staff update inquiries" on public.pn_inquiries for update to authenticated using (public.pn_is_staff());
create policy "staff select orders" on public.pn_orders for select to authenticated using (public.pn_is_staff());
create policy "staff insert orders" on public.pn_orders for insert to authenticated with check (public.pn_is_staff());
create policy "staff update orders" on public.pn_orders for update to authenticated using (public.pn_is_staff());

grant usage on schema public to anon, authenticated;
grant insert on public.pn_inquiries to anon, authenticated;
grant select, update on public.pn_inquiries to authenticated;
grant select, insert, update on public.pn_orders to authenticated;
grant select on public.pn_staff to authenticated;

-- Add your staff emails (repeat as needed):
-- insert into public.pn_staff(email) values ('you@yourbrand.com');

-- Then create the matching staff user:
-- Supabase Dashboard → Authentication → Users → Add user
-- (same email, choose a password, confirm email)
