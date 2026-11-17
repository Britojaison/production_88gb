/** Structured payment terms on an expense + helpers shared by forms, import and dashboard. */

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Statuses that count as real spend (drafts and rejections are excluded). */
export const COMMITTED_STATUSES = ["SUBMITTED", "APPROVED"] as const;

export function isCommitted(status: string) {
  return (COMMITTED_STATUSES as readonly string[]).includes(status);
}

export function normalizePriority(raw: string | null | undefined): Priority | null {
  const v = raw?.trim().toUpperCase();
  if (!v) return null;
  if (v.startsWith("H")) return "HIGH";
  if (v.startsWith("M")) return "MEDIUM";
  if (v.startsWith("L")) return "LOW";
  return null;
}

export function priorityLabel(p: string | null | undefined) {
  switch (p) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return "—";
  }
}

export function priorityRank(p: string | null | undefined) {
  return p === "HIGH" ? 0 : p === "MEDIUM" ? 1 : p === "LOW" ? 2 : 3;
}

export function parseMoney(raw: string | null | undefined): number | null {
  const s = (raw ?? "").replace(/[",\s₹]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** dd/mm/yyyy, dd-mm-yyyy or ISO → Date (UTC). First date if several. */
export function parseLooseDate(raw: string | null | undefined): Date | null {
  const first = (raw ?? "").split(/[&,]/)[0]?.trim() ?? "";
  if (!first) return null;
  const m = first.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const dt = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const iso = Date.parse(first);
  return Number.isNaN(iso) ? null : new Date(iso);
}

/** Amount still owed on an expense (0 once settled). */
export function outstandingAmount(e: {
  amount: number;
  paid: boolean;
  advancePaid?: number | null;
}) {
  if (e.paid) return 0;
  return Math.max(0, e.amount - (e.advancePaid ?? 0));
}

export type PaymentTerms = {
  priority: Priority | null;
  dueDate: Date | null;
  advancePaid: number | null;
  invoiceUrl: string | null;
  remarks: string | null;
};

/**
 * Recover structured terms from the legacy free-text block the CSV importer
 * used to write into vendorPaymentDetails ("Invoice: …", "Priority: …", …).
 */
export function parseLegacyDetails(text: string | null | undefined): PaymentTerms {
  const out: PaymentTerms = {
    priority: null,
    dueDate: null,
    advancePaid: null,
    invoiceUrl: null,
    remarks: null,
  };
  for (const line of (text ?? "").split(/\r?\n/)) {
    const m = line.match(/^\s*(Invoice|Priority|Advance|Due|Remarks)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const val = m[2]!.trim();
    if (!val) continue;
    if (key === "invoice" && /^https?:\/\//i.test(val)) out.invoiceUrl = val;
    if (key === "priority") out.priority = normalizePriority(val);
    if (key === "advance") out.advancePaid = parseMoney(val);
    if (key === "due") out.dueDate = parseLooseDate(val);
    if (key === "remarks") out.remarks = val;
  }
  return out;
}
