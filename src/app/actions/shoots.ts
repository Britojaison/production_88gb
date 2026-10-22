"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseBrandFormFields, resolveBrandIds } from "@/lib/brands";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  RANDOM_SHOOT_IMAGE,
  randomShootImage,
} from "@/lib/shoot-images";
import { shootFormSchema } from "@/lib/validations";

function parseShootForm(formData: FormData) {
  const image = formData.get("image");
  const imageValue =
    image && String(image).length > 0 && String(image) !== RANDOM_SHOOT_IMAGE
      ? image
      : undefined;
  const budgetRaw = formData.get("budget");
  return shootFormSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status"),
    image: imageValue,
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

  await prisma.shootBrand.deleteMany({ where: { shootId } });
  if (resolved.length > 0) {
    await prisma.shootBrand.createMany({
      data: resolved.map((brandId) => ({ shootId, brandId })),
    });
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
  const shoot = await prisma.shoot.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      status: data.status,
      image: data.image ?? randomShootImage(),
      budget: resolveBudget(data.budget),
    },
  });

  await syncShootBrands(shoot.id, formData);

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

  const existing = await prisma.shoot.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Shoot not found" };
  }

  const data = parsed.data;
  const image = data.image ?? existing.image ?? randomShootImage();

  await prisma.shoot.update({
    where: { id },
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      status: data.status,
      image,
      budget: resolveBudget(data.budget),
    },
  });

  await syncShootBrands(id, formData);

  revalidatePath("/shoots");
  revalidatePath(`/shoots/${id}`);
  revalidatePath("/brands");
  redirect(`/shoots/${id}`);
}
