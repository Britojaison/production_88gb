/**
 * Mark every expense unpaid except SSS Deck Shoot expenses on 27 Aug 2026.
 * Usage: npx tsx scripts/set-unpaid-except-sss-deck.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const shoot = await prisma.shoot.findFirst({
    where: { name: { equals: "SSS Deck Shoot" } },
  });
  if (!shoot) throw new Error('Shoot "SSS Deck Shoot" not found');

  const keep = await prisma.expense.findMany({
    where: {
      shootId: shoot.id,
      date: {
        gte: new Date("2026-08-27T00:00:00.000Z"),
        lt: new Date("2026-08-28T00:00:00.000Z"),
      },
    },
  });
  if (keep.length === 0) {
    throw new Error("No expenses on SSS Deck Shoot for 2026-08-27");
  }

  const keepIds = keep.map((e) => e.id);
  const cleared = await prisma.expense.updateMany({
    where: { id: { notIn: keepIds } },
    data: { paid: false, paidAt: null },
  });
  const marked = await prisma.expense.updateMany({
    where: { id: { in: keepIds } },
    data: { paid: true, paidAt: new Date("2026-08-27T00:00:00.000Z") },
  });

  const unpaid = await prisma.expense.count({ where: { paid: false } });
  const paid = await prisma.expense.count({ where: { paid: true } });

  console.log({
    shootId: shoot.id,
    shootName: shoot.name,
    exceptionDate: "2026-08-27",
    keep: keep.map((e) => ({ id: e.id, title: e.title, amount: e.amount })),
    clearedCount: cleared.count,
    markedPaidCount: marked.count,
    unpaid,
    paid,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
