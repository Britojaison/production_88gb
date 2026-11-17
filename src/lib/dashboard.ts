import { outstandingAmount, priorityRank } from "@/lib/payment-terms";

/** Minimal expense shape the dashboard aggregates over (committed expenses only). */
export type DashExpense = {
  id: string;
  title: string;
  amount: number;
  date: Date;
  status: string;
  paid: boolean;
  advancePaid: number | null;
  dueDate: Date | null;
  priority: string | null;
  paidTo: string;
  vendorId: string | null;
  category: { name: string } | null;
  shoot: {
    id: string;
    name: string;
    brands: Array<{ brand: { name: string } }>;
  };
};

export type Bar = { key: string; label: string; value: number; sub?: string };

export type VendorRow = {
  name: string;
  count: number;
  total: number;
  outstanding: number;
};

export type PayableRow = {
  id: string;
  title: string;
  shootName: string;
  paidTo: string;
  outstanding: number;
  dueDate: Date | null;
  priority: string | null;
  overdue: boolean;
  status: string;
  date: Date;
};

export type DashboardSummary = {
  totals: {
    committed: number;
    settled: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    pendingApproval: number;
    pendingCount: number;
    expenseCount: number;
  };
  byMonth: Bar[];
  byBrand: Bar[];
  byCategory: Bar[];
  vendors: VendorRow[];
  payables: PayableRow[];
  payablesCount: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y!.slice(2)}`;
}

function sortedBars(map: Map<string, number>, limit?: number): Bar[] {
  const bars = [...map.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value);
  if (!limit || bars.length <= limit) return bars;
  const head = bars.slice(0, limit - 1);
  const rest = bars.slice(limit - 1);
  return [
    ...head,
    {
      key: "__other",
      label: `Other (${rest.length})`,
      value: rest.reduce((s, b) => s + b.value, 0),
    },
  ];
}

export function summarize(
  expenses: DashExpense[],
  now: Date,
  opts: { maxMonths?: number; payablesLimit?: number } = {},
): DashboardSummary {
  const maxMonths = opts.maxMonths ?? 18;
  const payablesLimit = opts.payablesLimit ?? 12;

  const totals = {
    committed: 0,
    settled: 0,
    outstanding: 0,
    overdue: 0,
    overdueCount: 0,
    pendingApproval: 0,
    pendingCount: 0,
    expenseCount: expenses.length,
  };
  const month = new Map<string, number>();
  const brand = new Map<string, number>();
  const category = new Map<string, number>();
  const vendors = new Map<string, VendorRow>();
  const payables: PayableRow[] = [];

  for (const e of expenses) {
    const owed = outstandingAmount(e);
    totals.committed += e.amount;
    totals.outstanding += owed;
    totals.settled += e.amount - owed;
    if (e.status === "SUBMITTED") {
      totals.pendingApproval += e.amount;
      totals.pendingCount += 1;
    }
    const overdue = owed > 0 && e.dueDate != null && e.dueDate < now;
    if (overdue) {
      totals.overdue += owed;
      totals.overdueCount += 1;
    }

    const mk = monthKey(e.date);
    month.set(mk, (month.get(mk) ?? 0) + e.amount);

    // Multi-brand shoots: split the expense evenly so brand totals add up to spend.
    const brands = e.shoot.brands.map((b) => b.brand.name);
    if (brands.length === 0) {
      brand.set("No brand", (brand.get("No brand") ?? 0) + e.amount);
    } else {
      const share = e.amount / brands.length;
      for (const b of brands) brand.set(b, (brand.get(b) ?? 0) + share);
    }

    const cat = e.category?.name ?? "Uncategorized";
    category.set(cat, (category.get(cat) ?? 0) + e.amount);

    const vKey = e.vendorId ?? e.paidTo.trim().toLowerCase();
    const v = vendors.get(vKey) ?? { name: e.paidTo.trim(), count: 0, total: 0, outstanding: 0 };
    v.count += 1;
    v.total += e.amount;
    v.outstanding += owed;
    vendors.set(vKey, v);

    if (owed > 0) {
      payables.push({
        id: e.id,
        title: e.title,
        shootName: e.shoot.name,
        paidTo: e.paidTo,
        outstanding: owed,
        dueDate: e.dueDate,
        priority: e.priority,
        overdue,
        status: e.status,
        date: e.date,
      });
    }
  }

  // Continuous month axis (gaps shown as zero), most recent `maxMonths`.
  const keys = [...month.keys()].sort();
  const byMonth: Bar[] = [];
  if (keys.length > 0) {
    const [y0, m0] = keys[0]!.split("-").map(Number) as [number, number];
    const [y1, m1] = keys[keys.length - 1]!.split("-").map(Number) as [number, number];
    for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
      const k = `${y}-${String(m).padStart(2, "0")}`;
      byMonth.push({ key: k, label: monthLabel(k), value: month.get(k) ?? 0 });
    }
  }

  payables.sort(
    (a, b) =>
      Number(b.overdue) - Number(a.overdue) ||
      priorityRank(a.priority) - priorityRank(b.priority) ||
      (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity) ||
      a.date.getTime() - b.date.getTime(),
  );

  return {
    totals,
    byMonth: byMonth.slice(-maxMonths),
    byBrand: sortedBars(brand, 8),
    byCategory: sortedBars(category, 8),
    vendors: [...vendors.values()].sort((a, b) => b.total - a.total).slice(0, 10),
    payables: payables.slice(0, payablesLimit),
    payablesCount: payables.length,
  };
}

/** Indian financial year (Apr–Mar) containing `d`, as yyyy-mm-dd bounds. */
export function financialYear(d: Date) {
  const startYear = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return {
    from: `${startYear}-04-01`,
    to: `${startYear + 1}-03-31`,
    label: `FY ${String(startYear).slice(2)}–${String(startYear + 1).slice(2)}`,
  };
}

/** Compact INR for chart labels: ₹4.2L, ₹1.3Cr, ₹850. */
export function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(n)}`;
}
