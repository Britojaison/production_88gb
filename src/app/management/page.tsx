import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { MarkPaidButton } from "@/components/MarkPaidButton";
import { PaidBadge, StatusBadge } from "@/components/StatusBadge";
import { getCachedCategories } from "@/lib/data-cache";
import { listExpenses } from "@/lib/expense-query";
import { formatCurrency, formatDate } from "@/lib/format";
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

  // Imported queue is mostly APPROVED + unpaid — don't default to SUBMITTED
  const statusDefault = filters.status ?? "ALL";
  const paidDefault = filters.paid ?? "UNPAID";
  const [categories, expenses] = await Promise.all([
    getCachedCategories(),
    listExpenses(
      {
        q: filters.q,
        status: statusDefault,
        // Always hide drafts on the review queue unless explicitly filtered
        statusIn: ["SUBMITTED", "APPROVED", "REJECTED"],
        categoryId: filters.categoryId,
        paidTo: filters.paidTo,
        paid: paidDefault,
        from: filters.from,
        to: filters.to,
      },
      [
        { column: "paid", ascending: true },
        { column: "submittedAt", ascending: true },
        { column: "date", ascending: true },
      ],
    ),
  ]);

  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries({
    ...filters,
    status: statusDefault,
    paid: paidDefault,
  })) {
    if (v) exportQs.set(k, v);
  }

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <main className="page-shell-wide page-enter">
        <div className="page-header">
          <div>
            <h1 className="page-title">Expense reviews</h1>
            <p className="page-lead">
              Review queue defaults to unpaid (non-draft). Narrow with status,
              settlement, or search. Settlement Paid is separate from payee
              (Paid to).
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
          defaults={{
            ...filters,
            status: statusDefault,
            paid: paidDefault,
          }}
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
                  <th>Paid to</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-[var(--ink-muted)]">
                      {expense.shoot.name}
                    </td>
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
                    <td className="text-[var(--ink-muted)]">{expense.paidTo}</td>
                    <td>
                      <StatusBadge status={expense.status as ExpenseStatus} />
                    </td>
                    <td>
                      <PaidBadge paid={expense.paid} />
                    </td>
                    <td>
                      <MarkPaidButton
                        expenseId={expense.id}
                        paid={expense.paid}
                        status={expense.status}
                        compact
                      />
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
