import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteDraft,
  submitExpense,
  updateExpense,
} from "@/app/actions/expenses";
import { AppHeader } from "@/components/AppHeader";
import { ExpenseForm } from "@/components/ExpenseForm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";
import { publicUploadUrl } from "@/lib/uploads";

export const instant = false;

export default async function ShootExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id: shootId, expenseId } = await params;
  const session = await requireRole("VIDEO_TEAM");

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      shoot: true,
      category: true,
      reviewedBy: { select: { name: true } },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (
    !expense ||
    expense.shootId !== shootId ||
    expense.submitterId !== session.user.id
  ) {
    notFound();
  }

  const [categories, vendors] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  const editable =
    expense.status === "DRAFT" || expense.status === "REJECTED";

  const boundUpdate = updateExpense.bind(null, shootId, expense.id);
  const boundSubmit = submitExpense.bind(null, shootId, expense.id);
  const boundDelete = deleteDraft.bind(null, shootId, expense.id);

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-4">
          <Link
            href={`/shoots/${shootId}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to {expense.shoot.name}
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {expense.shoot.name}
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{expense.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(expense.date)} · {formatCurrency(expense.amount)}
              {expense.category ? ` · ${expense.category.name}` : ""}
            </p>
          </div>
          <StatusBadge status={expense.status as ExpenseStatus} />
        </div>

        {expense.status === "REJECTED" && expense.rejectionReason ? (
          <div className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <p className="font-medium">Rejected</p>
            <p className="mt-1">{expense.rejectionReason}</p>
          </div>
        ) : null}

        {expense.status === "APPROVED" ? (
          <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Approved
            {expense.reviewedBy ? ` by ${expense.reviewedBy.name}` : ""}
            {expense.reviewedAt ? ` on ${formatDate(expense.reviewedAt)}` : ""}.
          </div>
        ) : null}

        {expense.status === "SUBMITTED" ? (
          <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Submitted for approval
            {expense.submittedAt ? ` on ${formatDate(expense.submittedAt)}` : ""}.
          </div>
        ) : null}

        {expense.receiptPath ? (
          <div className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
            Receipt:{" "}
            <a
              href={publicUploadUrl(expense.receiptPath)}
              className="font-medium underline"
              target="_blank"
              rel="noreferrer"
            >
              {expense.receiptName ?? "Download"}
            </a>
          </div>
        ) : null}

        {editable ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <ExpenseForm
                action={boundUpdate}
                submitLabel="Save draft"
                categories={categories}
                vendors={vendors}
                existingReceiptName={expense.receiptName}
                initial={{
                  title: expense.title,
                  date: expense.date.toISOString().slice(0, 10),
                  amount: String(expense.amount),
                  paidTo: expense.paidTo,
                  vendorPaymentDetails: expense.vendorPaymentDetails,
                  categoryId: expense.categoryId ?? categories[0]?.id,
                  vendorId: expense.vendorId ?? "",
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={boundSubmit}>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Submit for approval
                </button>
              </form>
              {expense.status === "DRAFT" ? (
                <form action={boundDelete}>
                  <button
                    type="submit"
                    className="rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete draft
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm sm:p-6">
            <dl className="space-y-3">
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
            </dl>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Audit trail</h2>
          {expense.auditEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {expense.auditEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <p className="font-medium text-slate-900">
                    {ev.action}
                    {ev.fromStatus || ev.toStatus
                      ? ` (${ev.fromStatus ?? "—"} → ${ev.toStatus ?? "—"})`
                      : ""}
                  </p>
                  <p className="text-slate-600">
                    {ev.actor?.name ?? "System"} · {formatDate(ev.createdAt)}
                    {ev.createdAt.toISOString().slice(11, 16)}
                  </p>
                  {ev.note ? (
                    <p className="mt-1 text-slate-700">{ev.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
