import { prisma } from "@/lib/prisma";

export async function logExpenseAudit(opts: {
  expenseId: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
}) {
  await prisma.auditEvent.create({
    data: {
      expenseId: opts.expenseId,
      actorId: opts.actorId,
      action: opts.action,
      fromStatus: opts.fromStatus ?? null,
      toStatus: opts.toStatus ?? null,
      note: opts.note ?? null,
    },
  });
}
