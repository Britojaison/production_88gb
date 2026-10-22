"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import { categoryFormSchema } from "@/lib/validations";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireDbUser("MANAGEMENT");
  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return;
  }

  const slug = slugify(parsed.data.name);
  const clash = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: parsed.data.name }] },
  });
  if (clash) {
    return;
  }

  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/management/categories");
}
