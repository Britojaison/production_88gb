-- 88GB Production Expenses — schema reference (public.*_slate in Supabase).
-- Generated from the live database on 2026-11-18; replaces prisma/schema.prisma.
-- Apply changes as new migrations (Supabase SQL editor / migrations), then update this
-- file and src/lib/db/types.ts.
--
-- Timestamps are `timestamp without time zone` holding UTC wall time
-- (read with toDate(), write with toDb() in src/lib/db).
-- RLS is ON with no policies: only the server's service-role key can read/write.

create table public.users_slate (
  id text not null default (gen_random_uuid())::text,
  email text not null,
  name text not null,
  "passwordHash" text not null,
  role text not null,                       -- VIDEO_TEAM | MANAGEMENT
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint users_slate_pkey primary key (id)
);
create unique index users_slate_email_key on public.users_slate (email);

create table public.shoots_slate (
  id text not null default (gen_random_uuid())::text,
  name text not null,
  "startDate" timestamp(3) not null,
  "endDate" timestamp(3),
  notes text,
  image text,
  budget double precision,                  -- INR
  status text not null default 'PLANNED',   -- PLANNED | ACTIVE | WRAPPED
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint shoots_slate_pkey primary key (id)
);

create table public.brands_slate (
  id text not null default (gen_random_uuid())::text,
  name text not null,
  "logoPath" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint brands_slate_pkey primary key (id)
);
create unique index brands_slate_name_key on public.brands_slate (name);

create table public.shoot_brands_slate (
  "shootId" text not null,
  "brandId" text not null,
  constraint shoot_brands_slate_pkey primary key ("shootId", "brandId"),
  constraint "shoot_brands_slate_shootId_fkey" foreign key ("shootId") references public.shoots_slate(id) on update cascade on delete cascade,
  constraint "shoot_brands_slate_brandId_fkey" foreign key ("brandId") references public.brands_slate(id) on update cascade on delete cascade
);

create table public.categories_slate (
  id text not null default (gen_random_uuid())::text,
  name text not null,
  slug text not null,
  "sortOrder" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint categories_slate_pkey primary key (id)
);
create unique index categories_slate_name_key on public.categories_slate (name);
create unique index categories_slate_slug_key on public.categories_slate (slug);

create table public.vendors_slate (
  id text not null default (gen_random_uuid())::text,
  name text not null,
  "paymentDetails" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint vendors_slate_pkey primary key (id)
);

create table public.expenses_slate (
  id text not null default (gen_random_uuid())::text,
  "shootId" text not null,
  title text not null,
  date timestamp(3) not null,
  amount double precision not null,
  "paidTo" text not null,
  "vendorPaymentDetails" text not null,
  "categoryId" text,
  "vendorId" text,
  "receiptPath" text,                       -- "supabase:<key>" or "uploads/<file>" (local dev)
  "receiptName" text,
  status text not null default 'DRAFT',     -- DRAFT | SUBMITTED | APPROVED | REJECTED
  "rejectionReason" text,
  paid boolean not null default false,      -- settlement flag (not the payee)
  "paidAt" timestamp(3),
  "submitterId" text not null,
  "submittedAt" timestamp(3),
  "reviewedAt" timestamp(3),
  "reviewedById" text,
  priority text,                            -- HIGH | MEDIUM | LOW
  "dueDate" timestamp(3),
  "advancePaid" double precision,
  "invoiceUrl" text,
  remarks text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint expenses_slate_pkey primary key (id),
  constraint "expenses_slate_shootId_fkey" foreign key ("shootId") references public.shoots_slate(id) on update cascade on delete cascade,
  constraint "expenses_slate_categoryId_fkey" foreign key ("categoryId") references public.categories_slate(id) on update cascade on delete set null,
  constraint "expenses_slate_vendorId_fkey" foreign key ("vendorId") references public.vendors_slate(id) on update cascade on delete set null,
  constraint "expenses_slate_submitterId_fkey" foreign key ("submitterId") references public.users_slate(id) on update cascade on delete restrict,
  constraint "expenses_slate_reviewedById_fkey" foreign key ("reviewedById") references public.users_slate(id) on update cascade on delete set null
);
create index expenses_slate_status_paid_idx on public.expenses_slate (status, paid);
create index "expenses_slate_dueDate_idx" on public.expenses_slate ("dueDate");
create index "expenses_slate_shootId_idx" on public.expenses_slate ("shootId");

create table public.audit_events_slate (
  id text not null default (gen_random_uuid())::text,
  "expenseId" text not null,
  "actorId" text,
  action text not null,
  "fromStatus" text,
  "toStatus" text,
  note text,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint audit_events_slate_pkey primary key (id),
  constraint "audit_events_slate_expenseId_fkey" foreign key ("expenseId") references public.expenses_slate(id) on update cascade on delete cascade,
  constraint "audit_events_slate_actorId_fkey" foreign key ("actorId") references public.users_slate(id) on update cascade on delete set null
);

create table public.notifications_slate (
  id text not null default (gen_random_uuid())::text,
  "userId" text not null,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  "expenseId" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint notifications_slate_pkey primary key (id),
  constraint "notifications_slate_userId_fkey" foreign key ("userId") references public.users_slate(id) on update cascade on delete cascade,
  constraint "notifications_slate_expenseId_fkey" foreign key ("expenseId") references public.expenses_slate(id) on update cascade on delete set null
);

-- Server-only access: RLS on, no policies (service role bypasses RLS).
alter table public.users_slate enable row level security;
alter table public.shoots_slate enable row level security;
alter table public.brands_slate enable row level security;
alter table public.shoot_brands_slate enable row level security;
alter table public.categories_slate enable row level security;
alter table public.vendors_slate enable row level security;
alter table public.expenses_slate enable row level security;
alter table public.audit_events_slate enable row level security;
alter table public.notifications_slate enable row level security;

-- "updatedAt" maintained by the database
create or replace function public.slate_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new."updatedAt" := (now() at time zone 'utc');
  return new;
end $$;
create trigger users_slate_touch before update on public.users_slate for each row execute function public.slate_touch_updated_at();
create trigger shoots_slate_touch before update on public.shoots_slate for each row execute function public.slate_touch_updated_at();
create trigger brands_slate_touch before update on public.brands_slate for each row execute function public.slate_touch_updated_at();
create trigger vendors_slate_touch before update on public.vendors_slate for each row execute function public.slate_touch_updated_at();
create trigger expenses_slate_touch before update on public.expenses_slate for each row execute function public.slate_touch_updated_at();
