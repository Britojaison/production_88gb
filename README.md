# 88GB Production Expenses

Local expense tracker for a video production team. Expenses live under **shoots**. Team submits; management approves/rejects.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (Supabase)
- Supabase Storage for receipts (private bucket, served via signed URLs)
- NextAuth credentials (email + password)

## Setup

```bash
cp .env.example .env
npm install
npm run db:setup    # ⚠ force-resets the database in DATABASE_URL + seeds
npm run dev
```

After schema changes without wiping data: `npm run db:sync` then restart `npm run dev`.

After `db:setup`, **sign out and sign back in** (user ids change).

## Seed logins

| Role | Email | Password |
|------|-------|----------|
| Video team | `team@88gb.local` | `password123` |
| Management | `mgmt@88gb.local` | `password123` |

Seed also creates categories, vendors, brands/clients (MM wear, MilkymistD, Super Saravana Stores, Cinco, Sathya), shoots with budgets (some multi-brand), and a submitted expense.

## Try features 1–9

1. **Receipts** — Team → shoot → Add expense → attach image/PDF → save; view/replace/remove on draft detail. Stored in Supabase Storage (or `public/uploads/` locally without Supabase env).
2. **Budget** — Create/edit shoot with optional budget; cards + shoot detail show spent / remaining (all expense statuses).
3. **Users** — Management → Users → create video_team or management accounts.
4. **Filters** — Shoots list (name/status); shoot expenses + management list (status, category, payee, dates, search).
5. **Export** — “Export CSV” on shoot detail and management list (respects current filters).
6. **Notifications** — Submit → management gets Alerts; approve/reject → submitter notified. Optional email: set `SMTP_HOST` later (stub logs only today).
7. **Vendors** — `/vendors` directory; pick on expense form to prefills payee + payment details. Brands/clients — `/brands` directory; multi-select on shoot create/edit (type new names to auto-save); shown on shoot cards + detail.
8. **Categories** — Required on expenses (Model, Freelancer, Makeup Artist, Camera Rental, Studio, Location, Cinematographers); management can add more; shoot detail shows totals by category. Reseed after category list changes: `npm run db:setup`.
9. **Audit trail** — Expense detail (team + management) lists submit/approve/reject (and create/update) with actor + time.

## Dashboard (management)

`/dashboard` is the management home. Committed spend = SUBMITTED + APPROVED (drafts and
rejections never count, here or on shoot cards / shoot budgets).

- KPIs: committed spend, settled (incl. advances), outstanding, overdue, awaiting approval
- Spend by month, by brand (multi-brand shoots split evenly), by category
- "What to pay next": unpaid items ordered overdue → priority → due date
- Top vendors with amount still owed
- Budget burn per shoot (lifetime, ignores the date filter)
- Filters: Indian FY / last 90 days / all time presets, custom dates, brand

## Payment terms

Expenses carry structured `priority` (HIGH/MEDIUM/LOW), `dueDate`, `advancePaid`,
`invoiceUrl` and `remarks`. Outstanding = amount − advance until marked paid.
The CSV importer fills these directly. For data imported before these columns existed:

```bash
npm run db:sync                        # add the new columns (non-destructive)
npm run db:backfill-terms              # dry run
npm run db:backfill-terms -- --apply   # copy terms out of the old payment-details text
```

## Receipts (Supabase Storage)

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_RECEIPTS_BUCKET`,
default `receipts`) locally and in Vercel. Receipts are stored as `supabase:<key>` and opened
through `/api/receipts/[expenseId]`, which checks the viewer (management, or the submitter)
and redirects to a 60-second signed URL. Move existing local files with
`npm run receipts:migrate` (creates the private bucket if missing).

## Deferred

- Real SMTP/Slack delivery (in-app Notification model + `sendEmailStub` hook only).
- Excel `.xlsx` (CSV is Excel-friendly).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:setup` | Reset DB + seed |
| `npm run db:sync` | Push schema + regenerate client |
| `npm run db:seed` | Re-seed only |
| `npm run db:import` | ⚠ Replace shoots/expenses with the master CSV |
| `npm run db:backfill-terms` | Fill payment-term columns from old text (`-- --apply`) |
| `npm run receipts:migrate` | Upload local receipts to Supabase Storage |
