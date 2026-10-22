"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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

  await prisma.vendor.create({
    data: {
      name: parsed.data.name,
      paymentDetails: parsed.data.paymentDetails,
    },
  });

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

  await prisma.vendor.update({
    where: { id },
    data: {
      name: parsed.data.name,
      paymentDetails: parsed.data.paymentDetails,
    },
  });

  revalidatePath("/vendors");
}
