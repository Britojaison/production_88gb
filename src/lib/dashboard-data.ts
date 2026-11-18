import { db, fetchAll, must, revive, toDb } from "@/lib/db";
import { COMMITTED_STATUSES } from "@/lib/payment-terms";

/** Data for /dashboard: committed expenses in range + budgeted shoots (lifetime). */
export async function loadDashboardData(opts: { from?: string; to?: string; brandId?: string }) {
  // Brand filter → shoot ids first (shoots can carry several brands)
  let shootIds: string[] | null = null;
  if (opts.brandId) {
    const links = must(
      await db().from("shoot_brands_slate").select("shootId").eq("brandId", opts.brandId),
      "brand shoots",
    );
    shootIds = links.map((l) => l.shootId);
    if (shootIds.length === 0) return { expenses: [], budgetShoots: [] };
  }

  const expenses = await fetchAll((from, to) => {
    let q = db()
      .from("expenses_slate")
      .select(
        "id, title, amount, date, status, paid, advancePaid, dueDate, priority, paidTo, vendorId, category:categories_slate(name), shoot:shoots_slate(id, name, brands:shoot_brands_slate(brand:brands_slate(name)))",
      )
      .in("status", [...COMMITTED_STATUSES]);
    if (shootIds) q = q.in("shootId", shootIds);
    if (opts.from) q = q.gte("date", toDb(new Date(opts.from)));
    if (opts.to) q = q.lte("date", toDb(new Date(`${opts.to}T23:59:59.999Z`)));
    return q.order("id").range(from, to);
  }, "dashboard expenses");

  // Budget burn is lifetime per shoot (not date-filtered): a budget covers the whole shoot.
  let bq = db()
    .from("shoots_slate")
    .select("id, name, budget, status, expenses:expenses_slate(amount, status)")
    .not("budget", "is", null)
    .in("expenses.status", [...COMMITTED_STATUSES]);
  if (shootIds) bq = bq.in("id", shootIds);
  const budgetShoots = must(await bq, "budget shoots");

  return { expenses: revive(expenses), budgetShoots };
}
