import type { Prisma } from "@prisma/client";

export function buildExpenseWhere(opts: {
  shootId?: string;
  q?: string | null;
  status?: string | null;
  categoryId?: string | null;
  paidTo?: string | null;
  /** ALL | PAID | UNPAID — settlement flag, not payee */
  paid?: string | null;
  from?: string | null;
  to?: string | null;
  statusIn?: string[];
}): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};

  if (opts.shootId) where.shootId = opts.shootId;
  if (opts.statusIn) where.status = { in: opts.statusIn };
  if (opts.status && opts.status !== "ALL") where.status = opts.status;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.paidTo?.trim()) {
    where.paidTo = { contains: opts.paidTo.trim(), mode: "insensitive" };
  }
  if (opts.paid === "PAID") where.paid = true;
  if (opts.paid === "UNPAID") where.paid = false;
  if (opts.from || opts.to) {
    where.date = {};
    if (opts.from) where.date.gte = new Date(opts.from);
    if (opts.to) where.date.lte = new Date(opts.to);
  }
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { paidTo: { contains: q, mode: "insensitive" } },
      { shoot: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}
