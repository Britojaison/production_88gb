import { setExpensePaid } from "@/app/actions/expenses";

/**
 * Management-only: toggle settlement paid flag.
 * Paying requires an approved expense; undoing a payment is always allowed.
 */
export function MarkPaidButton({
  expenseId,
  paid,
  status,
  compact = false,
}: {
  expenseId: string;
  paid: boolean;
  status: string;
  compact?: boolean;
}) {
  if (!paid && status !== "APPROVED") {
    return (
      <span
        className="text-xs text-[var(--ink-faint)]"
        title="Only approved expenses can be marked paid"
      >
        {status === "SUBMITTED" ? "Approve first" : "—"}
      </span>
    );
  }

  const action = setExpensePaid.bind(null, expenseId, !paid);

  return (
    <form action={action}>
      <button
        type="submit"
        className={
          compact
            ? "btn btn-secondary !px-2.5 !py-1 text-xs"
            : "btn btn-secondary"
        }
        title={
          paid
            ? "Mark as unpaid (settlement)"
            : "Mark as paid (settlement — not payee)"
        }
      >
        {paid ? "Mark unpaid" : "Mark paid"}
      </button>
    </form>
  );
}
