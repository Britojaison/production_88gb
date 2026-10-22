"use server";

import { revalidatePath } from "next/cache";
import { findOrCreateBrand } from "@/lib/brands";
import { requireDbUser } from "@/lib/session";
import { z } from "zod";

const brandNameSchema = z.string().trim().min(1).max(200);

export async function createBrand(formData: FormData): Promise<void> {
  await requireDbUser();
  const parsed = brandNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return;

  await findOrCreateBrand(parsed.data);
  revalidatePath("/brands");
  revalidatePath("/shoots");
}
