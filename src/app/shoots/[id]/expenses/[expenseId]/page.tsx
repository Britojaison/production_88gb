import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteDraft,
  submitExpense,
  updateExpense,
} from "@/app/actions/expenses";
import { AppShell } from "@/components/AppShell";
import { ExpenseForm } from "@/components/ExpenseForm";
import { PaymentTermsList } from "@/components/PaymentTermsList";
import { PaidBadge, StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getExpenseDetail } from "@/lib/expense-query";
import { getCachedCategories } from "@/lib/data-cache";
import { listVendors } from "@/lib/vendors";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";
import { receiptHref } from "@/lib/uploads";

export const instant = false;

export default async function ShootExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id: shootId, expenseId } = await params;
  const session = await requireRole("VIDEO_TEAM");

  const expense = await getExpenseDetail(expenseId);

  if (
    !expense ||
    expense.shootId !== shootId ||
    expense.submitterId !== session.user.id
  ) {
    notFound();
  }

  const [categories, vendors] = await Promise.all([
    getCachedCategories(),
    listVendors(),
  ]);

  const editable =
    expense.status === "DRAFT" || expense.status === "REJECTED";

  const boundUpdate = updateExpense.bind(null, shootId, expense.id);
  const boundSubmit = submitExpense.bind(null, shootId, expense.id);
  const boundDelete = deleteDraft.bind(null, shootId, expense.id);

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <div className="mb-4">
          <Link href={`/shoots/${shootId}`} className="back-link">
            ← Back to {expense.shoot.name}
          </Link>
        </div>

        <div className="page-header">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {expense.shoot.name}
            </p>
            <h1 className="page-title mt-0.5">{expense.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {formatDate(expense.date)} ·{" "}
              <span className="amount">{formatCurrency(expense.amount)}</span>
              {expense.category ? ` · ${expense.category.name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={expense.status as ExpenseStatus} />
            <PaidBadge paid={expense.paid} />
          </div>
        </div>

        {expense.status === "REJECTED" && expense.rejectionReason ? (
          <div className="mb-4 rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-ink)]">
            <p className="font-medium">Rejected</p>
            <p className="mt-1">{expense.rejectionReason}</p>
          </div>
        ) : null}

        {expense.status === "APPROVED" ? (
          <div className="mb-4 rounded-md bg-[var(--ok-bg)] px-3 py-2 text-sm text-[var(--ok-ink)]">
            Approved
            {expense.reviewedBy ? ` by ${expense.reviewedBy.name}` : ""}
            {expense.reviewedAt ? ` on ${formatDate(expense.reviewedAt)}` : ""}.
          </div>
        ) : null}

        {expense.status === "SUBMITTED" ? (
          <div className="mb-4 rounded-md bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn-ink)]">
            Submitted for approval
            {expense.submittedAt ? ` on ${formatDate(expense.submittedAt)}` : ""}.
          </div>
        ) : null}

        {expense.receiptPath ? (
          <div className="panel mb-4 px-3.5 py-2.5 text-sm">
            Receipt:{" "}
            <a
              href={receiptHref(expense.id)}
              className="font-medium text-[var(--accent-ink)] underline"
              target="_blank"
              rel="noreferrer"
            >
              {expense.receiptName ?? "Download"}
            </a>
          </div>
        ) : null}

        {editable ? (
          <div className="space-y-4">
            <div className="panel panel-pad sm:!p-6">
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
                  priority: expense.priority ?? "",
                  dueDate: expense.dueDate
                    ? expense.dueDate.toISOString().slice(0, 10)
                    : "",
                  advancePaid:
                    expense.advancePaid != null ? String(expense.advancePaid) : "",
                  invoiceUrl: expense.invoiceUrl ?? "",
                  remarks: expense.remarks ?? "",
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={boundSubmit}>
                <button
                  type="submit"
                  className="btn bg-[var(--ok-ink)] text-white hover:opacity-90"
                >
                  Submit for approval
                </button>
              </form>
              {expense.status === "DRAFT" ? (
                <form action={boundDelete}>
                  <button
                    type="submit"
                    className="btn border border-[var(--danger-ink)] bg-transparent text-[var(--danger-ink)] hover:bg-[var(--danger-bg)]"
                  >
                    Delete draft
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="panel panel-pad text-sm sm:!p-6">
            <dl className="space-y-3">
              <div>
                <dt className="text-[var(--ink-faint)]">Paid to</dt>
                <dd className="font-medium text-[var(--ink)]">{expense.paidTo}</dd>
              </div>
              <div>
                <dt className="text-[var(--ink-faint)]">Vendor payment details</dt>
                <dd className="whitespace-pre-wrap text-[var(--ink)]">
                  {expense.vendorPaymentDetails}
                </dd>
              </div>
              <PaymentTermsList expense={expense} now={new Date()} />
            </dl>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-[var(--ink)]">
            Audit trail
          </h2>
          {expense.auditEvents.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">No events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {expense.auditEvents.map((ev) => (
                <li key={ev.id} className="panel px-3.5 py-2.5">
                  <p className="font-medium text-[var(--ink)]">
                    {ev.action}
                    {ev.fromStatus || ev.toStatus
                      ? ` (${ev.fromStatus ?? "—"} → ${ev.toStatus ?? "—"})`
                      : ""}
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    {ev.actor?.name ?? "System"} · {formatDate(ev.createdAt)}{" "}
                    {ev.createdAt.toISOString().slice(11, 16)}
                  </p>
                  {ev.note ? (
                    <p className="mt-1 text-[var(--ink-muted)]">{ev.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
