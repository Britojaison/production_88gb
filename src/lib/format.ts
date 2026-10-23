import type { ExpenseStatus, ShootStatus } from "@/lib/types";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateRange(start: Date | string, end?: Date | string | null) {
  const startLabel = formatDate(start);
  if (!end) return startLabel;
  const endLabel = formatDate(end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function statusLabel(status: ExpenseStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function statusClass(status: ExpenseStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border-strong)]";
    case "SUBMITTED":
      return "bg-[var(--warn-bg)] text-[var(--warn-ink)] border border-transparent";
    case "APPROVED":
      return "bg-[var(--ok-bg)] text-[var(--ok-ink)] border border-transparent";
    case "REJECTED":
      return "bg-[var(--danger-bg)] text-[var(--danger-ink)] border border-transparent";
    default:
      return "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border)]";
  }
}

export function shootStatusLabel(status: ShootStatus) {
  switch (status) {
    case "PLANNED":
      return "Planned";
    case "ACTIVE":
      return "Active";
    case "WRAPPED":
      return "Wrapped";
    default:
      return status;
  }
}

export function shootStatusClass(status: ShootStatus) {
  switch (status) {
    case "PLANNED":
      return "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border-strong)]";
    case "ACTIVE":
      return "bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--border-strong)]";
    case "WRAPPED":
      return "bg-[var(--ok-bg)] text-[var(--ok-ink)] border border-transparent";
    default:
      return "bg-[var(--surface-raised)] text-[var(--ink-muted)] border border-[var(--border)]";
  }
}
