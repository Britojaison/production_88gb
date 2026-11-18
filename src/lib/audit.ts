import { db, must } from "@/lib/db";

export async function logExpenseAudit(opts: {
  expenseId: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
}) {
  must(
    await db().from("audit_events_slate").insert({
      expenseId: opts.expenseId,
      actorId: opts.actorId,
      action: opts.action,
      fromStatus: opts.fromStatus ?? null,
      toStatus: opts.toStatus ?? null,
      note: opts.note ?? null,
    }),
    "write audit event",
  );
}
