import { statusClass, statusLabel, shootStatusClass, shootStatusLabel } from "@/lib/format";
import type { ExpenseStatus, ShootStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

export function ShootStatusBadge({ status }: { status: ShootStatus }) {
  return (
    <span className={`status-badge ${shootStatusClass(status)}`}>
      {shootStatusLabel(status)}
    </span>
  );
}

/** Settlement paid flag — not the "Paid to" payee column. */
export function PaidBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={`status-badge ${
        paid
          ? "bg-[var(--ok-bg)] text-[var(--ok-ink)] border border-transparent"
          : "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border-strong)]"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}
