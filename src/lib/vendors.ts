import { prisma } from "@/lib/prisma";

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
    const selected = await prisma.vendor.findUnique({
      where: { id: opts.vendorId },
    });
    if (selected) {
      return selected.id;
    }
  }

  const all = await prisma.vendor.findMany({
    select: { id: true, name: true },
  });
  const existing = all.find(
    (v) => v.name.toLowerCase() === paidTo.toLowerCase(),
  );
  if (existing) {
    return existing.id;
  }

  const created = await prisma.vendor.create({
    data: {
      name: paidTo,
      paymentDetails,
    },
  });
  return created.id;
}
