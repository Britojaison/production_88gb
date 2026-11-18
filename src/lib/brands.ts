import { logoPathForBrandName } from "@/lib/brand-logos";
import { db, must } from "@/lib/db";

export const SEED_BRANDS = [
  "MM wear",
  "MilkymistD",
  "Super Saravana Stores",
  "Cinco",
  "Sathya",
] as const;

/** Find or create a brand by case-insensitive name. */
export async function findOrCreateBrand(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Brand name is required");
  }

  const all = must(
    await db().from("brands_slate").select("id, name, logoPath"),
    "load brands",
  );
  const existing = all.find(
    (b) => b.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) {
    const logoPath = logoPathForBrandName(existing.name);
    if (logoPath && !existing.logoPath) {
      must(
        await db().from("brands_slate").update({ logoPath }).eq("id", existing.id),
        "update brand logo",
      );
    }
    return existing.id;
  }

  const created = must(
    await db()
      .from("brands_slate")
      .insert({ name: trimmed, logoPath: logoPathForBrandName(trimmed) })
      .select("id")
      .single(),
    "create brand",
  );
  return created.id;
}

/**
 * Resolve brand ids from form: selected directory ids + new names.
 * New names are created (or matched case-insensitively).
 */
export async function resolveBrandIds(opts: {
  brandIds: string[];
  newNames: string[];
}): Promise<string[]> {
  const ids = new Set<string>();

  if (opts.brandIds.length > 0) {
    const found = must(
      await db().from("brands_slate").select("id").in("id", opts.brandIds),
      "load selected brands",
    );
    for (const b of found) ids.add(b.id);
  }

  for (const name of opts.newNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    ids.add(await findOrCreateBrand(trimmed));
  }

  return [...ids];
}

export function parseBrandFormFields(formData: FormData): {
  brandIds: string[];
  newNames: string[];
} {
  const brandIds = formData
    .getAll("brandIds")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const newRaw = String(formData.get("newBrands") ?? "");
  const newNames = newRaw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return { brandIds, newNames };
}
