import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ShootStatusBadge, StatusBadge } from "@/components/StatusBadge";
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
    from: filters.from,
    to: filters.to,
  });
  // Team only sees own expenses on detail
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
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4">
          <Link href="/shoots" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to shoots
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{shoot.name}</h1>
              <ShootStatusBadge status={shoot.status as ShootStatus} />
            </div>
            {brandNames.length > 0 ? (
              <p className="text-sm text-slate-500">{brandNames.join(" · ")}</p>
            ) : null}
            <p className="text-sm text-slate-600">
              {formatDateRange(shoot.startDate, shoot.endDate)}
            </p>
            {shoot.notes ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{shoot.notes}</p>
            ) : null}
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>
                Spent (all statuses):{" "}
                <span className="font-medium">{formatCurrency(spent)}</span>
              </p>
              {shoot.budget != null ? (
                <p>
                  Budget {formatCurrency(shoot.budget)} · Remaining{" "}
                  <span
                    className={
                      shoot.budget - spent < 0
                        ? "font-medium text-rose-700"
                        : "font-medium"
                    }
                  >
                    {formatCurrency(shoot.budget - spent)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/export/shoot/${shoot.id}?${exportQs.toString()}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </Link>
            <Link
              href={`/shoots/${shoot.id}/edit`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit shoot
            </Link>
            <Link
              href={`/shoots/${shoot.id}/expenses/new`}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add expense
            </Link>
          </div>
        </div>

        {byCategory.size > 0 ? (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Totals by category
            </h2>
            <ul className="divide-y divide-slate-100 text-sm text-slate-700">
              {[...byCategory.entries()].map(([name, amount]) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate">{name}</span>
                  <span className="shrink-0 tabular-nums font-medium text-slate-900">
                    {formatCurrency(amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h2 className="mb-3 text-lg font-semibold text-slate-900">Expenses</h2>
        <ExpenseFilters
          action={`/shoots/${shoot.id}`}
          categories={categories}
          defaults={filters}
        />

        {expenses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No expenses match.{" "}
            <Link
              href={`/shoots/${shoot.id}/expenses/new`}
              className="font-medium text-slate-900 underline"
            >
              Add one
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Paid to</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/shoots/${shoot.id}/expenses/${expense.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {expense.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {expense.category?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-3 py-2">{formatCurrency(expense.amount)}</td>
                    <td className="px-3 py-2 text-slate-600">{expense.paidTo}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={expense.status as ExpenseStatus} />
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {expense.receiptPath ? (
                        <a
                          href={publicUploadUrl(expense.receiptPath)}
                          className="underline"
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
    </>
  );
}
