# 88GB Production Expenses

Local expense tracker for a video production team. Expenses live under **shoots**. Team submits; management approves/rejects.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite
- NextAuth credentials (email + password)

## Setup

```bash
cp .env.example .env
npm install
npm run db:setup    # force-reset SQLite + seed
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

1. **Receipts** — Team → shoot → Add expense → attach image/PDF → save; view/replace/remove on draft detail. Files in `public/uploads/`.
2. **Budget** — Create/edit shoot with optional budget; cards + shoot detail show spent / remaining (all expense statuses).
3. **Users** — Management → Users → create video_team or management accounts.
4. **Filters** — Shoots list (name/status); shoot expenses + management list (status, category, payee, dates, search).
5. **Export** — “Export CSV” on shoot detail and management list (respects current filters).
6. **Notifications** — Submit → management gets Alerts; approve/reject → submitter notified. Optional email: set `SMTP_HOST` later (stub logs only today).
7. **Vendors** — `/vendors` directory; pick on expense form to prefills payee + payment details. Brands/clients — `/brands` directory; multi-select on shoot create/edit (type new names to auto-save); shown on shoot cards + detail.
8. **Categories** — Required on expenses (Model, Freelancer, Makeup Artist, Camera Rental, Studio, Location, Cinematographers); management can add more; shoot detail shows totals by category. Reseed after category list changes: `npm run db:setup`.
9. **Audit trail** — Expense detail (team + management) lists submit/approve/reject (and create/update) with actor + time.

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
