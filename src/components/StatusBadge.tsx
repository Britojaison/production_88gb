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
