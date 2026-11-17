/**
 * One-off: copy payment terms that the old CSV importer packed into
 * `vendorPaymentDetails` ("Invoice: …", "Priority: …", "Due: …", "Advance: …",
 * "Remarks: …") into the new structured columns.
 *
 * Non-destructive: only fills columns that are still empty; the original text is kept.
 * Run: npm run db:backfill-terms           (dry run, prints what would change)
 *      npm run db:backfill-terms -- --apply
 */
import { PrismaClient } from "@prisma/client";
import { parseLegacyDetails } from "../src/lib/payment-terms";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const expenses = await prisma.expense.findMany({
    select: {
      id: true,
      title: true,
      vendorPaymentDetails: true,
      priority: true,
      dueDate: true,
      advancePaid: true,
      invoiceUrl: true,
      remarks: true,
    },
  });

  let changed = 0;
  for (const e of expenses) {
    const t = parseLegacyDetails(e.vendorPaymentDetails);
    const data: Record<string, unknown> = {};
    if (e.priority == null && t.priority) data.priority = t.priority;
    if (e.dueDate == null && t.dueDate) data.dueDate = t.dueDate;
    if (e.advancePaid == null && t.advancePaid != null) data.advancePaid = t.advancePaid;
    if (e.invoiceUrl == null && t.invoiceUrl) data.invoiceUrl = t.invoiceUrl;
    if (e.remarks == null && t.remarks) data.remarks = t.remarks;
    if (Object.keys(data).length === 0) continue;

    changed++;
    if (apply) {
      await prisma.expense.update({ where: { id: e.id }, data });
    } else if (changed <= 10) {
      console.log(e.title, data);
    }
  }

  console.log(
    `${apply ? "Updated" : "Would update"} ${changed} of ${expenses.length} expenses.` +
      (apply ? "" : " Re-run with --apply to write."),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
