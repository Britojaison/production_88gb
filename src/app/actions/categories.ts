"use server";

import { revalidatePath } from "next/cache";
import { invalidateMemoryCache } from "@/lib/data-cache";
import { db, must } from "@/lib/db";
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
  const clash = must(
    await db()
      .from("categories_slate")
      .select("id")
      .or(`slug.eq."${slug}",name.eq."${parsed.data.name.replace(/"/g, "")}"`)
      .limit(1),
    "check category",
  )[0];
  if (clash) {
    return;
  }

  const last = must(
    await db()
      .from("categories_slate")
      .select("sortOrder")
      .order("sortOrder", { ascending: false })
      .limit(1),
    "last category",
  )[0];

  must(
    await db().from("categories_slate").insert({
      name: parsed.data.name,
      slug,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    }),
    "create category",
  );
  invalidateMemoryCache("categories");

  revalidatePath("/management/categories");
}
