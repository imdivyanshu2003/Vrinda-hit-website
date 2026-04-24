-- ============================================================
--  VRINDA HIT — Supabase schema
--  Run this ONCE in your Supabase project.
--  Dashboard → SQL Editor → New query → paste ALL of this → Run.
-- ============================================================

-- =============== EXTENSIONS ===============
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- =============== TABLES ===============

-- Every generated site lives here. The actual HTML lives in Storage bucket `sites`
-- under the path defined by `storage_path` (usually `<slug>.html`).
create table if not exists public.sites (
    slug             text primary key,
    order_id         uuid,                    -- links back to orders.id (nullable for admin/test runs)
    brand            text,
    idea             text not null,
    theme            text not null,
    style            text not null,
    palette          text not null,
    plan             text not null,           -- basic | premium | pro
    email            text,
    phone            text,
    storage_path     text not null,           -- path in `sites` bucket
    html_size_bytes  integer,
    model            text,                    -- claude model used
    tokens_in        integer default 0,
    tokens_out       integer default 0,
    latency_ms       integer,
    views            integer default 0,
    created_at       timestamptz default now()
);

create index if not exists sites_created_idx on public.sites(created_at desc);
create index if not exists sites_email_idx   on public.sites(email);

-- Every paid order. One order → zero or one generated site.
create table if not exists public.orders (
    id                   uuid primary key default gen_random_uuid(),
    slug                 text references public.sites(slug) on delete set null,
    plan                 text not null,          -- basic | premium | pro
    amount_inr           integer not null,       -- in rupees, e.g. 299 / 999 / 1999
    status               text not null default 'pending',
                         -- pending | paid | generated | delivered | failed
    idea                 text,
    brand                text,
    theme                text,
    style_key            text,
    palette_key          text,
    email                text,
    phone                text,
    razorpay_order_id    text unique,
    razorpay_payment_id  text,
    error_message        text,
    source               text,                   -- e.g. 'razorpay' | 'whatsapp_manual' | 'test'
    created_at           timestamptz default now(),
    updated_at           timestamptz default now()
);

create index if not exists orders_status_idx   on public.orders(status);
create index if not exists orders_created_idx  on public.orders(created_at desc);
create index if not exists orders_email_idx    on public.orders(email);

-- =============== FUNCTIONS ===============

-- Increment view count atomically (called from /api/site/[slug])
create or replace function public.increment_site_view(p_slug text)
returns void
language sql
security definer
as $$
    update public.sites set views = coalesce(views, 0) + 1 where slug = p_slug;
$$;

-- Auto-update `updated_at` on orders
create or replace function public.tg_orders_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
    before update on public.orders
    for each row execute function public.tg_orders_updated_at();

-- =============== ROW-LEVEL SECURITY ===============
-- We access everything through the service role key from our API routes,
-- which bypasses RLS. For safety, enable RLS on both tables so NOTHING
-- is exposed via the anon/public key.

alter table public.sites  enable row level security;
alter table public.orders enable row level security;

-- (Intentionally no policies — only the service role can read/write.)

-- =============== STORAGE BUCKET ===============
-- NOTE: Buckets cannot be created via SQL; create via the Dashboard.
-- Dashboard → Storage → New bucket:
--    Name: sites
--    Public: OFF (private — served through our API route)
--    File size limit: 5 MB (default is fine)
--
-- No policies needed because API uses the service role key.
