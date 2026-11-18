"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { parseBrandFormFields, resolveBrandIds } from "@/lib/brands";
import { invalidateMemoryCache } from "@/lib/data-cache";
import { db, maybe, must, toDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { shootFormSchema } from "@/lib/validations";

function parseShootForm(formData: FormData) {
  const budgetRaw = formData.get("budget");
  return shootFormSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status"),
    budget: budgetRaw == null || String(budgetRaw).trim() === "" ? "" : budgetRaw,
  });
}

function resolveBudget(budget: number | "" | undefined): number | null {
  if (budget === "" || budget == null) return null;
  return budget;
}

async function syncShootBrands(shootId: string, formData: FormData) {
  const { brandIds, newNames } = parseBrandFormFields(formData);
  const resolved = await resolveBrandIds({ brandIds, newNames });

  must(await db().from("shoot_brands_slate").delete().eq("shootId", shootId), "clear shoot brands");
  if (resolved.length > 0) {
    must(
      await db()
        .from("shoot_brands_slate")
        .insert(resolved.map((brandId) => ({ shootId, brandId }))),
      "link shoot brands",
    );
  }
}

export async function createShoot(
  formData: FormData,
): Promise<{ error: string } | void> {
  await requireRole("VIDEO_TEAM");
  const parsed = parseShootForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const shoot = must(
    await db()
      .from("shoots_slate")
      .insert({
        name: data.name,
        startDate: toDb(new Date(data.startDate)),
        endDate: data.endDate ? toDb(new Date(data.endDate)) : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
        status: data.status,
        image: null,
        budget: resolveBudget(data.budget),
      })
      .select("id")
      .single(),
    "create shoot",
  );

  await syncShootBrands(shoot.id, formData);

  invalidateMemoryCache();
  try {
    revalidateTag("shoots", { expire: 0 });
  } catch {
    // ignore
  }
  revalidatePath("/shoots");
  revalidatePath("/brands");
  redirect(`/shoots/${shoot.id}`);
}

export async function updateShoot(
  id: string,
  formData: FormData,
): Promise<{ error: string } | void> {
  await requireRole("VIDEO_TEAM");
  const parsed = parseShootForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = maybe(
    await db().from("shoots_slate").select("id").eq("id", id).maybeSingle(),
    "load shoot",
  );
  if (!existing) {
    return { error: "Shoot not found" };
  }

  const data = parsed.data;

  must(
    await db()
      .from("shoots_slate")
      .update({
        name: data.name,
        startDate: toDb(new Date(data.startDate)),
        endDate: data.endDate ? toDb(new Date(data.endDate)) : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
        status: data.status,
        budget: resolveBudget(data.budget),
      })
      .eq("id", id),
    "update shoot",
  );

  await syncShootBrands(id, formData);

  invalidateMemoryCache();
  try {
    revalidateTag("shoots", { expire: 0 });
  } catch {
    // ignore
  }
  revalidatePath("/shoots");
  revalidatePath(`/shoots/${id}`);
  revalidatePath("/brands");
  redirect(`/shoots/${id}`);
}

export async function getMoreShootsAction({
  offset,
  limit = 6,
  status,
  q,
}: {
  offset: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  const { getCachedShoots } = await import("@/lib/data-cache");
  const data = await getCachedShoots({ status, q, limit, offset });

  return {
    shoots: data.shoots,
    totalCount: data.totalCount,
    hasMore: offset + data.shoots.length < data.totalCount,
  };
}
