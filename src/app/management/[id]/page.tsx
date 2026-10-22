import Link from "next/link";
import { notFound } from "next/navigation";
import { approveExpense, rejectExpense } from "@/app/actions/expenses";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";
import { publicUploadUrl } from "@/lib/uploads";

export const instant = false;

export default async function ManagementExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("MANAGEMENT");

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      submitter: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
      shoot: { select: { id: true, name: true } },
      category: true,
      auditEvents: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!expense) notFound();

  const boundApprove = approveExpense.bind(null, expense.id);
  const boundReject = rejectExpense.bind(null, expense.id);
  const isPending = expense.status === "SUBMITTED";

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-4">
          <Link
            href="/management"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to reviews
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Shoot: {expense.shoot.name}
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{expense.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              From {expense.submitter.name} ({expense.submitter.email})
            </p>
          </div>
          <StatusBadge status={expense.status as ExpenseStatus} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm sm:p-6">
          <dl className="space-y-3">
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium text-slate-900">
                {expense.category?.name ?? "—"}
              </dd>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Expense date</dt>
                <dd className="font-medium text-slate-900">
                  {formatDate(expense.date)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Amount</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(expense.amount)}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-slate-500">Paid to</dt>
              <dd className="font-medium text-slate-900">{expense.paidTo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vendor payment details</dt>
              <dd className="whitespace-pre-wrap text-slate-900">
                {expense.vendorPaymentDetails}
              </dd>
            </div>
            {expense.receiptPath ? (
              <div>
                <dt className="text-slate-500">Receipt</dt>
                <dd>
                  <a
                    href={publicUploadUrl(expense.receiptPath)}
                    className="font-medium underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {expense.receiptName ?? "Open receipt"}
                  </a>
                </dd>
              </div>
            ) : null}
            {expense.rejectionReason ? (
              <div>
                <dt className="text-slate-500">Rejection reason</dt>
                <dd className="text-rose-700">{expense.rejectionReason}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {isPending ? (
          <div className="mt-6 space-y-4">
            <form action={boundApprove}>
              <button
                type="submit"
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Approve
              </button>
            </form>
            <form
              action={boundReject}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <label
                htmlFor="reason"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Reject with reason
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
              >
                Reject
              </button>
            </form>
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Audit trail</h2>
          <ul className="space-y-2 text-sm">
            {expense.auditEvents.map((ev) => (
              <li
                key={ev.id}
                className="rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <p className="font-medium text-slate-900">{ev.action}</p>
                <p className="text-slate-600">
                  {ev.actor?.name ?? "System"} · {formatDate(ev.createdAt)}
                </p>
                {ev.note ? <p className="mt-1 text-slate-700">{ev.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
