import { formatCurrency, formatDate } from "@/lib/format";
import { outstandingAmount, priorityLabel } from "@/lib/payment-terms";

type TermsExpense = {
  amount: number;
  paid: boolean;
  priority: string | null;
  dueDate: Date | null;
  advancePaid: number | null;
  invoiceUrl: string | null;
  remarks: string | null;
};

/** <dl> rows for an expense's structured payment terms. Renders nothing if none are set. */
export function PaymentTermsList({ expense, now }: { expense: TermsExpense; now: Date }) {
  const hasTerms =
    expense.priority ||
    expense.dueDate ||
    expense.advancePaid != null ||
    expense.invoiceUrl ||
    expense.remarks;
  if (!hasTerms) return null;

  const outstanding = outstandingAmount(expense);
  const overdue =
    !expense.paid && expense.dueDate != null && expense.dueDate < now;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-[var(--ink-faint)]">Due date</dt>
          <dd className="font-medium text-[var(--ink)]">
            {expense.dueDate ? formatDate(expense.dueDate) : "—"}
            {overdue ? (
              <span className="ml-2 rounded px-1.5 py-0.5 text-xs bg-[var(--danger-bg)] text-[var(--danger-ink)]">
                Overdue
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--ink-faint)]">Priority</dt>
          <dd className="font-medium text-[var(--ink)]">
            {priorityLabel(expense.priority)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--ink-faint)]">Outstanding</dt>
          <dd className="amount font-medium text-[var(--ink)]">
            {formatCurrency(outstanding)}
            {expense.advancePaid ? (
              <span className="block text-xs font-normal text-[var(--ink-muted)]">
                after {formatCurrency(expense.advancePaid)} advance
              </span>
            ) : null}
          </dd>
        </div>
      </div>
      {expense.invoiceUrl ? (
        <div>
          <dt className="text-[var(--ink-faint)]">Invoice</dt>
          <dd>
            <a
              href={expense.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all font-medium text-[var(--accent-ink)] underline"
            >
              Open invoice
            </a>
          </dd>
        </div>
      ) : null}
      {expense.remarks ? (
        <div>
          <dt className="text-[var(--ink-faint)]">Remarks</dt>
          <dd className="whitespace-pre-wrap text-[var(--ink)]">{expense.remarks}</dd>
        </div>
      ) : null}
    </>
  );
}
