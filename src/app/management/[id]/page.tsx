import Link from "next/link";
import { notFound } from "next/navigation";
import { approveExpense, rejectExpense } from "@/app/actions/expenses";
import { AppShell } from "@/components/AppShell";
import { MarkPaidButton } from "@/components/MarkPaidButton";
import { PaymentTermsList } from "@/components/PaymentTermsList";
import { PaidBadge, StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ExpenseStatus } from "@/lib/types";
import { receiptHref } from "@/lib/uploads";

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
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <div className="mb-4">
          <Link href="/management" className="back-link">
            ← Back to reviews
          </Link>
        </div>

        <div className="page-header">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              Shoot: {expense.shoot.name}
            </p>
            <h1 className="page-title mt-0.5">{expense.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              From {expense.submitter.name} ({expense.submitter.email})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={expense.status as ExpenseStatus} />
            <PaidBadge paid={expense.paid} />
          </div>
        </div>

        <div className="panel panel-pad text-sm sm:!p-6">
          <dl className="space-y-3">
            <div>
              <dt className="text-[var(--ink-faint)]">Category</dt>
              <dd className="font-medium text-[var(--ink)]">
                {expense.category?.name ?? "—"}
              </dd>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[var(--ink-faint)]">Expense date</dt>
                <dd className="font-medium text-[var(--ink)]">
                  {formatDate(expense.date)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-faint)]">Amount</dt>
                <dd className="amount font-medium text-[var(--ink)]">
                  {formatCurrency(expense.amount)}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-[var(--ink-faint)]">Paid to (payee)</dt>
              <dd className="font-medium text-[var(--ink)]">{expense.paidTo}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-faint)]">Settlement</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                <PaidBadge paid={expense.paid} />
                {expense.paid && expense.paidAt ? (
                  <span className="text-xs text-[var(--ink-muted)]">
                    since {formatDate(expense.paidAt)}
                  </span>
                ) : null}
                <MarkPaidButton expenseId={expense.id} paid={expense.paid} />
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-faint)]">Vendor payment details</dt>
              <dd className="whitespace-pre-wrap text-[var(--ink)]">
                {expense.vendorPaymentDetails}
              </dd>
            </div>
            <PaymentTermsList expense={expense} now={new Date()} />
            {expense.receiptPath ? (
              <div>
                <dt className="text-[var(--ink-faint)]">Receipt</dt>
                <dd>
                  <a
                    href={receiptHref(expense.id)}
                    className="font-medium text-[var(--accent-ink)] underline"
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
                <dt className="text-[var(--ink-faint)]">Rejection reason</dt>
                <dd className="text-[var(--danger-ink)]">{expense.rejectionReason}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {isPending ? (
          <div className="mt-6 space-y-4">
            <form action={boundApprove}>
              <button
                type="submit"
                className="btn bg-[var(--ok-ink)] text-white hover:opacity-90"
              >
                Approve
              </button>
            </form>
            <form action={boundReject} className="panel panel-pad">
              <label htmlFor="reason" className="field-label">
                Reject with reason
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                className="field-input mb-3"
              />
              <button
                type="submit"
                className="btn bg-[var(--danger-ink)] text-white hover:opacity-90"
              >
                Reject
              </button>
            </form>
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-[var(--ink)]">
            Audit trail
          </h2>
          <ul className="space-y-2 text-sm">
            {expense.auditEvents.map((ev) => (
              <li key={ev.id} className="panel px-3.5 py-2.5">
                <p className="font-medium text-[var(--ink)]">{ev.action}</p>
                <p className="text-[var(--ink-muted)]">
                  {ev.actor?.name ?? "System"} · {formatDate(ev.createdAt)}
                </p>
                {ev.note ? (
                  <p className="mt-1 text-[var(--ink-muted)]">{ev.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
