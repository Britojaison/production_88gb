import { statusClass, statusLabel, shootStatusClass, shootStatusLabel } from "@/lib/format";
import type { ExpenseStatus, ShootStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function ShootStatusBadge({ status }: { status: ShootStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${shootStatusClass(status)}`}
    >
      {shootStatusLabel(status)}
    </span>
  );
}
