import { setExpensePaid } from "@/app/actions/expenses";

/** Management-only: toggle settlement paid flag. */
export function MarkPaidButton({
  expenseId,
  paid,
  compact = false,
}: {
  expenseId: string;
  paid: boolean;
  compact?: boolean;
}) {
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
