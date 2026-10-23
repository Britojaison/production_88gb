import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { PaidBadge, ShootStatusBadge, StatusBadge } from "@/components/StatusBadge";
import { buildExpenseWhere } from "@/lib/expense-query";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus, ShootStatus } from "@/lib/types";
import { publicUploadUrl } from "@/lib/uploads";

export const instant = false;

export default async function ShootDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const session = await requireRole("VIDEO_TEAM");

  const shoot = await prisma.shoot.findUnique({
    where: { id },
    include: {
      brands: {
        include: { brand: true },
        orderBy: { brand: { name: "asc" } },
      },
    },
  });
  if (!shoot) notFound();
  const brandNames = shoot.brands.map((sb) => sb.brand.name);

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const where = buildExpenseWhere({
    shootId: shoot.id,
    q: filters.q,
    status: filters.status,
    categoryId: filters.categoryId,
    paidTo: filters.paidTo,
    paid: filters.paid,
    from: filters.from,
    to: filters.to,
  });
  where.submitterId = session.user.id;

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  const allForTotals = await prisma.expense.findMany({
    where: { shootId: shoot.id, submitterId: session.user.id },
    include: { category: true },
  });
  const spent = allForTotals.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of allForTotals) {
    const key = e.category?.name ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount);
  }

  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) exportQs.set(k, v);
  }

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter">
        <div className="mb-4">
          <Link href="/shoots" className="back-link">
            ← Back to shoots
          </Link>
        </div>

        <div className="page-header">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h1 className="page-title">{shoot.name}</h1>
              <ShootStatusBadge status={shoot.status as ShootStatus} />
            </div>
            {brandNames.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {brandNames.map((b) => (
                  <span key={b} className="brand-chip">
                    {b}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="text-sm text-[var(--ink-muted)]">
              {formatDateRange(shoot.startDate, shoot.endDate)}
            </p>
            {shoot.notes ? (
              <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
                {shoot.notes}
              </p>
            ) : null}
            <div className="panel mt-5 grid max-w-xl gap-4 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                  Spent
                </p>
                <p className="amount-lg mt-1">{formatCurrency(spent)}</p>
              </div>
              {shoot.budget != null ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      Budget
                    </p>
                    <p className="amount-lg mt-1">{formatCurrency(shoot.budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      Remaining
                    </p>
                    <p
                      className={
                        shoot.budget - spent < 0
                          ? "amount-lg mt-1 text-[var(--danger-ink)]"
                          : "amount-lg mt-1 text-[var(--ok-ink)]"
                      }
                    >
                      {formatCurrency(shoot.budget - spent)}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/export/shoot/${shoot.id}?${exportQs.toString()}`}
              className="btn btn-secondary"
            >
              Export CSV
            </Link>
            <Link href={`/shoots/${shoot.id}/edit`} className="btn btn-secondary">
              Edit shoot
            </Link>
            <Link
              href={`/shoots/${shoot.id}/expenses/new`}
              className="btn btn-primary"
            >
              Add expense
            </Link>
          </div>
        </div>

        {byCategory.size > 0 ? (
          <div className="panel panel-pad mb-6">
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-[var(--ink)]">
              Totals by category
            </h2>
            <ul className="divide-y divide-[var(--border)] text-sm">
              {[...byCategory.entries()].map(([name, amount]) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate text-[var(--ink-muted)]">
                    {name}
                  </span>
                  <span className="amount shrink-0 font-medium text-[var(--ink)]">
                    {formatCurrency(amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h2 className="mb-3 text-base font-semibold tracking-tight text-[var(--ink)]">
          Expenses
        </h2>
        <ExpenseFilters
          action={`/shoots/${shoot.id}`}
          categories={categories}
          defaults={filters}
        />

        {expenses.length === 0 ? (
          <div className="panel-dashed p-8 text-center text-sm text-[var(--ink-muted)]">
            No expenses match.{" "}
            <Link
              href={`/shoots/${shoot.id}/expenses/new`}
              className="font-medium text-[var(--accent-ink)] underline"
            >
              Add one
            </Link>
            .
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Paid to</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <Link
                        href={`/shoots/${shoot.id}/expenses/${expense.id}`}
                        className="font-medium text-[var(--ink)] hover:text-[var(--accent-ink)] hover:underline"
                      >
                        {expense.title}
                      </Link>
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {expense.category?.name ?? "—"}
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {formatDate(expense.date)}
                    </td>
                    <td className="amount">{formatCurrency(expense.amount)}</td>
                    <td className="text-[var(--ink-muted)]">{expense.paidTo}</td>
                    <td>
                      <StatusBadge status={expense.status as ExpenseStatus} />
                    </td>
                    <td>
                      <PaidBadge paid={expense.paid} />
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {expense.receiptPath ? (
                        <a
                          href={publicUploadUrl(expense.receiptPath)}
                          className="text-[var(--accent-ink)] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AppShell>
  );
}
