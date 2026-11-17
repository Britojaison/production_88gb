import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ============================================================
// Zero-Cost In-Memory Cache (RAM Map in Node.js process)
// Works in both dev and production, eliminates WAN latency to Tokyo.
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

/**
 * Static Categories cache (1 hour TTL).
 */
export async function getCachedCategories() {
  const key = "categories:all";
  const cached = getFromMemory<Awaited<ReturnType<typeof prisma.category.findMany>>>(key);
  if (cached) return cached;

  const data = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return setToMemory(key, data, 3600);
}

/**
 * Static Brands cache (1 hour TTL).
 */
export async function getCachedBrands() {
  const key = "brands:all";
  const cached = getFromMemory<Awaited<ReturnType<typeof prisma.brand.findMany>>>(key);
  if (cached) return cached;

  const data = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return setToMemory(key, data, 3600);
}

/**
 * Consolidated expense status counts (60s TTL).
 */
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

  const where = submitterId ? { submitterId } : {};
  const grouped = await prisma.expense.groupBy({
    by: ["status", "paid"],
    where,
    _count: { id: true },
  });

  let submitted = 0;
  let approved = 0;
  let rejected = 0;
  let paid = 0;
  let unpaidApproved = 0;

  for (const row of grouped) {
    const n = row._count.id;
    if (row.status === "SUBMITTED") submitted += n;
    if (row.status === "APPROVED") approved += n;
    if (row.status === "REJECTED") rejected += n;
    if (row.paid) paid += n;
    if (row.status === "APPROVED" && !row.paid) unpaidApproved += n;
  }

  const result = { submitted, approved, rejected, paid, unpaidApproved };
  return setToMemory(key, result, 60);
}

/**
 * Shoots list with pre-calculated expense totals in ONE query (60s TTL).
 */
export async function getCachedShoots(options?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const status = options?.status;
  const q = options?.q;
  const take = options?.limit ?? 6;
  const skip = options?.offset ?? 0;

  const key = `shoots:${status ?? "ALL"}:${q ?? ""}:${take}:${skip}`;
  const cached = getFromMemory<{
    shoots: CachedShootItem[];
    totalCount: number;
  }>(key);
  if (cached) return cached;

  const where: Prisma.ShootWhereInput = {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
            {
              brands: {
                some: { brand: { name: { contains: q, mode: "insensitive" as const } } },
              },
            },
          ],
        }
      : {}),
  };

  const [rawShoots, totalCount] = await Promise.all([
    prisma.shoot.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip,
      take,
      include: {
        _count: { select: { expenses: true } },
        brands: {
          include: { brand: true },
          orderBy: { brand: { name: "asc" } },
        },
        expenses: {
          select: { amount: true },
        },
      },
    }),
    prisma.shoot.count({ where }),
  ]);

  const shoots = rawShoots.map((s) => {
    const totalAmount = s.expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      budget: s.budget,
      expenseCount: s._count.expenses,
      totalAmount,
      brands: s.brands.map((b) => ({
        name: b.brand.name,
        logoPath: b.brand.logoPath,
      })),
    };
  });

  const result = { shoots, totalCount };
  return setToMemory(key, result, 60);
}

export type ExpenseWithShoot = Prisma.ExpenseGetPayload<{
  include: { shoot: { select: { id: true; name: true } } };
}>;

export type ShootDetailWithBrands = Prisma.ShootGetPayload<{
  include: {
    brands: {
      include: { brand: true };
      orderBy: { brand: { name: "asc" } };
    };
  };
}>;

/**
 * Recent request status pool for the sidebar rail (60s TTL).
 */
export async function getCachedRecentRequests(
  role: string,
  submitterId?: string,
): Promise<ExpenseWithShoot[]> {
  const key = `recent-requests:${role}:${submitterId ?? "all"}`;
  const cached = getFromMemory<ExpenseWithShoot[]>(key);
  if (cached) return cached;

  const requestWhere =
    role === "MANAGEMENT"
      ? { status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] } }
      : {
          submitterId,
          status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
        };

  const data = await prisma.expense.findMany({
    where: requestWhere,
    include: { shoot: { select: { id: true, name: true } } },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });

  return setToMemory(key, data, 60);
}

/**
 * Individual shoot detail cache (60s TTL).
 */
export async function getCachedShootDetail(
  id: string,
): Promise<ShootDetailWithBrands | null> {
  const key = `shoot-detail:${id}`;
  const cached = getFromMemory<ShootDetailWithBrands>(key);
  if (cached) return cached;

  const data = await prisma.shoot.findUnique({
    where: { id },
    include: {
      brands: {
        include: { brand: true },
        orderBy: { brand: { name: "asc" } },
      },
    },
  });

  if (data) {
    setToMemory(key, data, 60);
  }
  return data;
}
