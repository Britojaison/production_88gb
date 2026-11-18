import { db, fetchAll, likePattern, maybe, must, revive, toDb } from "@/lib/db";

export type ExpenseFilter = {
  shootId?: string;
  submitterId?: string;
  q?: string | null;
  status?: string | null;
  /** Used when status is ALL/empty: restrict to these statuses. */
  statusIn?: string[];
  categoryId?: string | null;
  paidTo?: string | null;
  /** ALL | PAID | UNPAID — settlement flag, not payee */
  paid?: string | null;
  from?: string | null;
  to?: string | null;
};

type OrderBy = Array<{ column: "paid" | "submittedAt" | "date" | "updatedAt"; ascending: boolean }>;

const LIST_SELECT =
  "*, category:categories_slate(*), shoot:shoots_slate(id, name), submitter:users_slate!expenses_slate_submitterId_fkey(name, email)" as const;

/**
 * Expenses matching the list/review/export filters, with category, shoot and submitter.
 * Replaces the old Prisma `buildExpenseWhere` + findMany pair.
 */
export async function listExpenses(filter: ExpenseFilter, orderBy: OrderBy = []) {
  // Free-text search also matches shoot names → resolve those to ids first.
  const pattern = filter.q?.trim() ? likePattern(filter.q) : null;
  let qShootIds: string[] = [];
  if (pattern) {
    const shoots = must(
      await db().from("shoots_slate").select("id").ilike("name", pattern),
      "search shoots",
    );
    qShootIds = shoots.map((s) => s.id);
  }

  const rows = await fetchAll((from, to) => {
    let q = db().from("expenses_slate").select(LIST_SELECT);
    if (filter.shootId) q = q.eq("shootId", filter.shootId);
    if (filter.submitterId) q = q.eq("submitterId", filter.submitterId);
    if (filter.status && filter.status !== "ALL") q = q.eq("status", filter.status);
    else if (filter.statusIn?.length) q = q.in("status", filter.statusIn);
    if (filter.categoryId) q = q.eq("categoryId", filter.categoryId);
    const payee = filter.paidTo?.trim() ? likePattern(filter.paidTo) : null;
    if (payee) q = q.ilike("paidTo", payee);
    if (filter.paid === "PAID") q = q.eq("paid", true);
    if (filter.paid === "UNPAID") q = q.eq("paid", false);
    if (filter.from) q = q.gte("date", toDb(new Date(filter.from)));
    if (filter.to) q = q.lte("date", toDb(new Date(filter.to)));
    if (pattern) {
      const v = `"${pattern.replace(/%/g, "*")}"`;
      const ors = [`title.ilike.${v}`, `paidTo.ilike.${v}`];
      if (qShootIds.length) ors.push(`shootId.in.(${qShootIds.join(",")})`);
      q = q.or(ors.join(","));
    }
    for (const o of orderBy) q = q.order(o.column, { ascending: o.ascending });
    return q.order("id").range(from, to);
  }, "list expenses");

  return revive(rows);
}

export type ListedExpense = Awaited<ReturnType<typeof listExpenses>>[number];

/** One expense with everything the detail pages show (audit trail newest first). */
export async function getExpenseDetail(id: string) {
  const row = maybe(
    await db()
      .from("expenses_slate")
      .select(
        "*, shoot:shoots_slate(*), category:categories_slate(*), submitter:users_slate!expenses_slate_submitterId_fkey(name, email), reviewedBy:users_slate!expenses_slate_reviewedById_fkey(name), auditEvents:audit_events_slate(*, actor:users_slate(name))",
      )
      .eq("id", id)
      .maybeSingle(),
    "load expense",
  );
  if (!row) return null;
  const expense = revive(row);
  expense.auditEvents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return expense;
}
