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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Expense reviews</h1>
            <p className="text-sm text-slate-600">
              Filter pending or historical expenses. Defaults to submitted.
            </p>
          </div>
          <Link
            href={`/api/export/management?${exportQs.toString()}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No expenses match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Shoot</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Submitter</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-700">{expense.shoot.name}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/management/${expense.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {expense.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {expense.category?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {expense.submitter.name}
                    </td>
                    <td className="px-3 py-2">{formatCurrency(expense.amount)}</td>
                    <td className="px-3 py-2">
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
