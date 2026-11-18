"use server";

import { revalidatePath } from "next/cache";
import { db, must } from "@/lib/db";
import { requireDbUser } from "@/lib/session";
import { vendorFormSchema } from "@/lib/validations";

export async function createVendor(formData: FormData): Promise<void> {
  await requireDbUser();
  const parsed = vendorFormSchema.safeParse({
    name: formData.get("name"),
    paymentDetails: formData.get("paymentDetails"),
  });
  if (!parsed.success) {
    return;
  }

  must(
    await db().from("vendors_slate").insert({
      name: parsed.data.name,
      paymentDetails: parsed.data.paymentDetails,
    }),
    "create vendor",
  );

  revalidatePath("/vendors");
  revalidatePath("/shoots");
}

export async function updateVendor(
  id: string,
  formData: FormData,
): Promise<void> {
  await requireDbUser();
  const parsed = vendorFormSchema.safeParse({
    name: formData.get("name"),
    paymentDetails: formData.get("paymentDetails"),
  });
  if (!parsed.success) {
    return;
  }

  must(
    await db()
      .from("vendors_slate")
      .update({
        name: parsed.data.name,
        paymentDetails: parsed.data.paymentDetails,
      })
      .eq("id", id),
    "update vendor",
  );

  revalidatePath("/vendors");
}
