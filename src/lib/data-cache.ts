import { db, fetchAll, likePattern, maybe, must, revive } from "@/lib/db";
import { COMMITTED_STATUSES } from "@/lib/payment-terms";

// ============================================================
// Zero-Cost In-Memory Cache (RAM Map in the Node.js process)
// ============================================================

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const memoryStore = new Map<string, CacheEntry<unknown>>();

export function getFromMemory<T>(key: string): T | undefined {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setToMemory<T>(key: string, data: T, ttlSeconds = 60): T {
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return data;
}

export function invalidateMemoryCache(prefix?: string): void {
  if (!prefix) {
    memoryStore.clear();
    return;
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}

export type CachedShootItem = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  budget: number | null;
  expenseCount: number;
  totalAmount: number;
  brands: Array<{ name: string; logoPath: string | null }>;
};

// ============================================================
// Cached Query Methods
// ============================================================

/** Categories (1 hour TTL). */
export async function getCachedCategories() {
  const key = "categories:all";
  type R = Awaited<ReturnType<typeof loadCategories>>;
  const cached = getFromMemory<R>(key);
  if (cached) return cached;
  return setToMemory(key, await loadCategories(), 3600);
}

async function loadCategories() {
  return revive(
    must(
      await db().from("categories_slate").select("*").order("sortOrder", { ascending: true }),
      "load categories",
    ),
  );
}

/** Brands (1 hour TTL). */
export async function getCachedBrands() {
  const key = "brands:all";
  type R = Awaited<ReturnType<typeof loadBrands>>;
  const cached = getFromMemory<R>(key);
  if (cached) return cached;
  return setToMemory(key, await loadBrands(), 3600);
}

async function loadBrands() {
  return revive(
    must(await db().from("brands_slate").select("*").order("name", { ascending: true }), "load brands"),
  );
}

/** Expense status counts (60s TTL). */
export async function getCachedExpenseCounts(submitterId?: string) {
  const key = `counts:${submitterId ?? "all"}`;
  const cached = getFromMemory<{
    submitted: number;
    approved: number;
    rejected: number;
    paid: number;
    unpaidApproved: number;
  }>(key);
  if (cached) return cached;

  const rows = await fetchAll((from, to) => {
    let q = db().from("expenses_slate").select("status, paid");
    if (submitterId) q = q.eq("submitterId", submitterId);
    return q.order("id").range(from, to);
  }, "count expenses");

  const result = { submitted: 0, approved: 0, rejected: 0, paid: 0, unpaidApproved: 0 };
  for (const row of rows) {
    if (row.status === "SUBMITTED") result.submitted++;
    if (row.status === "APPROVED") result.approved++;
    if (row.status === "REJECTED") result.rejected++;
    if (row.paid) result.paid++;
    if (row.status === "APPROVED" && !row.paid) result.unpaidApproved++;
  }
  return setToMemory(key, result, 60);
}

/** Shoots list with expense totals (60s TTL). */
export async function getCachedShoots(options?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const status = options?.status;
  const qText = options?.q;
  const take = options?.limit ?? 6;
  const skip = options?.offset ?? 0;

  const key = `shoots:${status ?? "ALL"}:${qText ?? ""}:${take}:${skip}`;
  const cached = getFromMemory<{ shoots: CachedShootItem[]; totalCount: number }>(key);
  if (cached) return cached;

  // Search covers shoot name, notes and brand names.
  const pattern = qText?.trim() ? likePattern(qText) : null;
  let brandShootIds: string[] = [];
  if (pattern) {
    const links = must(
      await db()
        .from("shoot_brands_slate")
        .select("shootId, brand:brands_slate!inner(name)")
        .ilike("brand.name", pattern),
      "search brands",
    );
    brandShootIds = [...new Set(links.map((l) => l.shootId))];
  }

  let q = db()
    .from("shoots_slate")
    .select(
      "*, all_expenses:expenses_slate(count), committed:expenses_slate(amount, status), shoot_brands:shoot_brands_slate(brand:brands_slate(name, logoPath))",
      { count: "exact" },
    )
    .in("committed.status", [...COMMITTED_STATUSES]);
  if (status && status !== "ALL") q = q.eq("status", status);
  if (pattern) {
    const v = `"${pattern.replace(/%/g, "*")}"`;
    const ors = [`name.ilike.${v}`, `notes.ilike.${v}`];
    if (brandShootIds.length) ors.push(`id.in.(${brandShootIds.join(",")})`);
    q = q.or(ors.join(","));
  }
  const res = await q
    .order("startDate", { ascending: false })
    .order("id")
    .range(skip, skip + take - 1);
  const rows = revive(must(res, "list shoots"));

  const shoots: CachedShootItem[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status,
    budget: s.budget,
    expenseCount: s.all_expenses[0]?.count ?? 0,
    totalAmount: s.committed.reduce((sum, e) => sum + e.amount, 0),
    brands: s.shoot_brands
      .flatMap((sb) => (sb.brand ? [{ name: sb.brand.name, logoPath: sb.brand.logoPath }] : []))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return setToMemory(key, { shoots, totalCount: res.count ?? shoots.length }, 60);
}

async function loadRecentRequests(role: string, submitterId?: string) {
  let q = db()
    .from("expenses_slate")
    .select("*, shoot:shoots_slate(id, name)")
    .in("status", ["SUBMITTED", "APPROVED", "REJECTED"]);
  if (role !== "MANAGEMENT" && submitterId) q = q.eq("submitterId", submitterId);
  const rows = must(
    await q
      .order("submittedAt", { ascending: false, nullsFirst: false })
      .order("updatedAt", { ascending: false })
      .limit(40),
    "recent requests",
  );
  return revive(rows);
}

export type ExpenseWithShoot = Awaited<ReturnType<typeof loadRecentRequests>>[number];

/** Recent request status pool for the sidebar rail (60s TTL). */
export async function getCachedRecentRequests(
  role: string,
  submitterId?: string,
): Promise<ExpenseWithShoot[]> {
  const key = `recent-requests:${role}:${submitterId ?? "all"}`;
  const cached = getFromMemory<ExpenseWithShoot[]>(key);
  if (cached) return cached;
  return setToMemory(key, await loadRecentRequests(role, submitterId), 60);
}

async function loadShootDetail(id: string) {
  const row = maybe(
    await db()
      .from("shoots_slate")
      .select("*, brands:shoot_brands_slate(brandId, shootId, brand:brands_slate(*))")
      .eq("id", id)
      .maybeSingle(),
    "load shoot",
  );
  if (!row) return null;
  const shoot = revive(row);
  shoot.brands.sort((a, b) => (a.brand?.name ?? "").localeCompare(b.brand?.name ?? ""));
  return shoot;
}

export type ShootDetailWithBrands = NonNullable<Awaited<ReturnType<typeof loadShootDetail>>>;

/** Individual shoot detail (60s TTL). */
export async function getCachedShootDetail(id: string): Promise<ShootDetailWithBrands | null> {
  const key = `shoot-detail:${id}`;
  const cached = getFromMemory<ShootDetailWithBrands>(key);
  if (cached) return cached;
  const data = await loadShootDetail(id);
  if (data) setToMemory(key, data, 60);
  return data;
}
