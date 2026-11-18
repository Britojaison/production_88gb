import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BarList, BudgetBurn, MonthColumns, type BudgetRow } from "@/components/DashboardCharts";
import { StatusBadge } from "@/components/StatusBadge";
import { getCachedBrands } from "@/lib/data-cache";
import { financialYear, formatCompactINR, summarize } from "@/lib/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { priorityLabel } from "@/lib/payment-terms";
import { loadDashboardData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";

export const instant = false;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireRole("MANAGEMENT");
  const params = await searchParams;
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";
  const brandId = params.brand?.trim() || "";

  const now = new Date();
  const fy = financialYear(now);
  const last90 = new Date(now.getTime() - 90 * 864e5);

  const [brands, { expenses, budgetShoots }] = await Promise.all([
    getCachedBrands(),
    loadDashboardData({ from, to, brandId }),
  ]);

  const s = summarize(expenses, now);
  const budgetRows: BudgetRow[] = budgetShoots
    .map((sh) => ({
      id: sh.id,
      name: sh.name,
      budget: sh.budget!,
      status: sh.status,
      spent: sh.expenses.reduce((sum, e) => sum + e.amount, 0),
    }))
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    .slice(0, 10);

  const presetHref = (f: string, t: string) => {
    const qs = new URLSearchParams();
    if (f) qs.set("from", f);
    if (t) qs.set("to", t);
    if (brandId) qs.set("brand", brandId);
    const q = qs.toString();
    return q ? `/dashboard?${q}` : "/dashboard";
  };
  const presets = [
    { label: fy.label, from: fy.from, to: fy.to },
    { label: "Last 90 days", from: isoDay(last90), to: isoDay(now) },
    { label: "All time", from: "", to: "" },
  ];
  const brandName = brands.find((b) => b.id === brandId)?.name;
  const t = s.totals;

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <main className="page-shell-wide page-enter">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-lead">
              Committed spend = submitted + approved expenses. Drafts and
              rejections are excluded.
              {brandName ? ` Showing ${brandName} only.` : ""}
            </p>
          </div>
          <Link href="/management?paid=UNPAID" className="btn btn-secondary">
            Open payables queue
          </Link>
        </div>

        <form method="get" action="/dashboard" className="dash-filters">
          <div className="dash-presets" role="group" aria-label="Date range presets">
            {presets.map((p) => {
              const active = p.from === from && p.to === to;
              return (
                <Link
                  key={p.label}
                  href={presetHref(p.from, p.to)}
                  className={active ? "dash-preset is-active" : "dash-preset"}
                  aria-current={active ? "true" : undefined}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
          <label className="dash-field">
            <span>From</span>
            <input type="date" name="from" defaultValue={from} className="field-input" />
          </label>
          <label className="dash-field">
            <span>To</span>
            <input type="date" name="to" defaultValue={to} className="field-input" />
          </label>
          <label className="dash-field">
            <span>Brand</span>
            <select name="brand" defaultValue={brandId} className="field-input">
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          {from || to || brandId ? (
            <Link href="/dashboard" className="btn btn-secondary">
              Reset
            </Link>
          ) : null}
        </form>

        <section className="kpi-grid" aria-label="Key figures">
          <div className="kpi-tile">
            <p className="kpi-label">Committed spend</p>
            <p className="kpi-value amount">{formatCurrency(t.committed)}</p>
            <p className="kpi-sub">{t.expenseCount} expenses</p>
          </div>
          <div className="kpi-tile">
            <p className="kpi-label">Settled</p>
            <p className="kpi-value amount">{formatCurrency(t.settled)}</p>
            <p className="kpi-sub">
              {t.committed > 0 ? Math.round((t.settled / t.committed) * 100) : 0}% of spend
              (incl. advances)
            </p>
          </div>
          <div className="kpi-tile">
            <p className="kpi-label">Outstanding</p>
            <p className="kpi-value amount">{formatCurrency(t.outstanding)}</p>
            <p className="kpi-sub">{s.payablesCount} unpaid</p>
          </div>
          <div className={t.overdueCount > 0 ? "kpi-tile is-alert" : "kpi-tile"}>
            <p className="kpi-label">Overdue</p>
            <p className="kpi-value amount">{formatCurrency(t.overdue)}</p>
            <p className="kpi-sub">
              {t.overdueCount > 0 ? `⚠ ${t.overdueCount} past due date` : "Nothing past due"}
            </p>
          </div>
          <div className="kpi-tile">
            <p className="kpi-label">Awaiting approval</p>
            <p className="kpi-value amount">{formatCurrency(t.pendingApproval)}</p>
            <p className="kpi-sub">{t.pendingCount} submitted</p>
          </div>
        </section>

        <section className="panel panel-pad dash-panel">
          <div className="dash-panel-head">
            <h2>Spend by month</h2>
            <p>By date of work · hover a month for the exact figure</p>
          </div>
          <MonthColumns bars={s.byMonth} />
        </section>

        <div className="dash-grid">
          <section className="panel panel-pad dash-panel">
            <div className="dash-panel-head">
              <h2>Spend by brand</h2>
              <p>Multi-brand shoots split evenly</p>
            </div>
            <BarList bars={s.byBrand} />
          </section>
          <section className="panel panel-pad dash-panel">
            <div className="dash-panel-head">
              <h2>Spend by category</h2>
            </div>
            <BarList bars={s.byCategory} />
          </section>
        </div>

        <div className="dash-grid dash-grid-wide">
          <section className="panel panel-pad dash-panel">
            <div className="dash-panel-head">
              <h2>What to pay next</h2>
              <p>
                Overdue first, then priority and due date
                {s.payablesCount > s.payables.length
                  ? ` · top ${s.payables.length} of ${s.payablesCount}`
                  : ""}
              </p>
            </div>
            {s.payables.length === 0 ? (
              <p className="dash-empty">All settled.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payee</th>
                      <th>Shoot</th>
                      <th>Due</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th className="text-right">Owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.payables.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link
                            href={`/management/${p.id}`}
                            className="font-medium text-[var(--ink)] hover:text-[var(--accent-ink)] hover:underline"
                          >
                            {p.paidTo}
                          </Link>
                        </td>
                        <td className="text-[var(--ink-muted)]">{p.shootName}</td>
                        <td className="text-[var(--ink-muted)]">
                          {p.dueDate ? formatDate(p.dueDate) : "—"}
                          {p.overdue ? <span className="tag-overdue">Overdue</span> : null}
                        </td>
                        <td className="text-[var(--ink-muted)]">{priorityLabel(p.priority)}</td>
                        <td>
                          <StatusBadge status={p.status as ExpenseStatus} />
                        </td>
                        <td className="amount text-right">{formatCurrency(p.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel panel-pad dash-panel">
            <div className="dash-panel-head">
              <h2>Top vendors</h2>
            </div>
            {s.vendors.length === 0 ? (
              <p className="dash-empty">No vendors in this range.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th className="text-right">Jobs</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.vendors.map((v) => (
                      <tr key={v.name}>
                        <td className="font-medium text-[var(--ink)]">{v.name}</td>
                        <td className="text-right text-[var(--ink-muted)]">{v.count}</td>
                        <td className="amount text-right">{formatCompactINR(v.total)}</td>
                        <td className="amount text-right text-[var(--ink-muted)]">
                          {v.outstanding > 0 ? formatCompactINR(v.outstanding) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="panel panel-pad dash-panel">
          <div className="dash-panel-head">
            <h2>Budget burn</h2>
            <p>Lifetime spend vs budget per shoot (ignores the date filter) · highest use first</p>
          </div>
          <BudgetBurn rows={budgetRows} />
        </section>
      </main>
    </AppShell>
  );
}
