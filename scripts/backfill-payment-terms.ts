/**
 * One-off: copy payment terms that the old CSV importer packed into
 * `vendorPaymentDetails` ("Invoice: …", "Priority: …", "Due: …", "Advance: …",
 * "Remarks: …") into the new structured columns.
 *
 * Non-destructive: only fills columns that are still empty; the original text is kept.
 * Run: npm run db:backfill-terms           (dry run, prints what would change)
 *      npm run db:backfill-terms -- --apply
 */
import { db, fetchAll, must, toDb, type Update } from "../src/lib/db";
import { parseLegacyDetails } from "../src/lib/payment-terms";

const apply = process.argv.includes("--apply");

async function main() {
  const expenses = await fetchAll(
    (from, to) =>
      db()
        .from("expenses_slate")
        .select("id, title, vendorPaymentDetails, priority, dueDate, advancePaid, invoiceUrl, remarks")
        .order("id")
        .range(from, to),
    "load expenses",
  );

  let changed = 0;
  for (const e of expenses) {
    const t = parseLegacyDetails(e.vendorPaymentDetails);
    const data: Update<"expenses_slate"> = {};
    if (e.priority == null && t.priority) data.priority = t.priority;
    if (e.dueDate == null && t.dueDate) data.dueDate = toDb(t.dueDate);
    if (e.advancePaid == null && t.advancePaid != null) data.advancePaid = t.advancePaid;
    if (e.invoiceUrl == null && t.invoiceUrl) data.invoiceUrl = t.invoiceUrl;
    if (e.remarks == null && t.remarks) data.remarks = t.remarks;
    if (Object.keys(data).length === 0) continue;

    changed++;
    if (apply) {
      must(await db().from("expenses_slate").update(data).eq("id", e.id), `update ${e.id}`);
    } else if (changed <= 10) {
      console.log(e.title, data);
    }
  }

  console.log(
    `${apply ? "Updated" : "Would update"} ${changed} of ${expenses.length} expenses.` +
      (apply ? "" : " Re-run with --apply to write."),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
