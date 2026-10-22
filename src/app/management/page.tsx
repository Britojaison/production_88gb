import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { StatusBadge } from "@/components/StatusBadge";
import { buildExpenseWhere } from "@/lib/expense-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";

export const instant = false;

export default async function ManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireRole("MANAGEMENT");
  const filters = await searchParams;

  const statusDefault = filters.status ?? "SUBMITTED";
  const where = buildExpenseWhere({
    q: filters.q,
    status: statusDefault,
    categoryId: filters.categoryId,
    paidTo: filters.paidTo,
    from: filters.from,
    to: filters.to,
  });

  const [categories, expenses] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.expense.findMany({
      where,
      include: {
        submitter: { select: { name: true, email: true } },
        shoot: { select: { name: true } },
        category: true,
      },
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filters, status: statusDefault })) {
    if (v) exportQs.set(k, v);
  }

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="page-shell page-enter">
        <div className="page-header">
          <div>
            <h1 className="page-title">Expense reviews</h1>
            <p className="page-lead">
              Filter pending or historical expenses. Defaults to submitted.
            </p>
          </div>
          <Link
            href={`/api/export/management?${exportQs.toString()}`}
            className="btn btn-secondary"
          >
            Export CSV
          </Link>
        </div>

        <ExpenseFilters
          action="/management"
          categories={categories}
          defaults={{ ...filters, status: statusDefault }}
        />

        {expenses.length === 0 ? (
          <div className="panel-dashed p-8 text-center text-sm text-[var(--ink-muted)]">
            No expenses match these filters.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shoot</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Submitter</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-[var(--ink-muted)]">{expense.shoot.name}</td>
                    <td>
                      <Link
                        href={`/management/${expense.id}`}
                        className="font-medium text-[var(--ink)] hover:text-[var(--accent-ink)] hover:underline"
                      >
                        {expense.title}
                      </Link>
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {expense.category?.name ?? "—"}
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {expense.submitter.name}
                    </td>
                    <td className="text-[var(--ink-muted)]">
                      {formatDate(expense.date)}
                    </td>
                    <td className="amount">{formatCurrency(expense.amount)}</td>
                    <td>
                      <StatusBadge status={expense.status as ExpenseStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
