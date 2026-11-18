import { db, maybe, must, revive } from "@/lib/db";

/**
 * Resolve vendorId for an expense:
 * - If a directory vendor was selected and still exists, use it.
 * - Else match by case-insensitive name on paidTo (reuse).
 * - Else create a Vendor from paidTo + payment details.
 */
export async function resolveVendorForExpense(opts: {
  vendorId?: string | null;
  paidTo: string;
  paymentDetails: string;
}): Promise<string> {
  const paidTo = opts.paidTo.trim();
  const paymentDetails = opts.paymentDetails.trim();

  if (opts.vendorId) {
    const selected = maybe(
      await db().from("vendors_slate").select("id").eq("id", opts.vendorId).maybeSingle(),
      "load vendor",
    );
    if (selected) {
      return selected.id;
    }
  }

  const existing = must(
    await db().from("vendors_slate").select("id").ilike("name", paidTo.replace(/[%_\\]/g, "\\$&")).limit(1),
    "match vendor",
  )[0];
  if (existing) {
    return existing.id;
  }

  const created = must(
    await db().from("vendors_slate").insert({ name: paidTo, paymentDetails }).select("id").single(),
    "create vendor",
  );
  return created.id;
}

/** Vendor directory, A–Z. */
export async function listVendors() {
  return revive(
    must(await db().from("vendors_slate").select("*").order("name", { ascending: true }), "load vendors"),
  );
}
