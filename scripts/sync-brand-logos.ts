/**
 * Apply BRAND_LOGO_FILES → Brand.logoPath for matching brand names.
 * Usage: npx tsx scripts/sync-brand-logos.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  BRAND_LOGO_FILES,
  canonicalBrandName,
  normalizeBrandKey,
} from "../src/lib/brand-logos";

const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const byKey = new Map(
    brands.map((b) => [normalizeBrandKey(canonicalBrandName(b.name)), b]),
  );

  const matched: Array<{ file: string; brand: string; path: string }> = [];
  const unmatchedFiles: string[] = [];
  const unmatchedBrands: string[] = [];

  for (const row of BRAND_LOGO_FILES) {
    const key = normalizeBrandKey(row.brandName);
    const brand = byKey.get(key);
    if (!brand) {
      unmatchedFiles.push(`${row.sourceFile} → ${row.brandName} (no Brand row)`);
      continue;
    }
    await prisma.brand.update({
      where: { id: brand.id },
      data: { logoPath: row.path },
    });
    matched.push({
      file: row.sourceFile,
      brand: brand.name,
      path: row.path,
    });
    byKey.delete(key);
  }

  for (const brand of brands) {
    const key = normalizeBrandKey(canonicalBrandName(brand.name));
    if (byKey.has(key) && !matched.some((m) => m.brand === brand.name)) {
      unmatchedBrands.push(brand.name);
    }
  }

  console.log("Matched:");
  for (const m of matched) {
    console.log(`  ${m.file} → ${m.brand} (${m.path})`);
  }
  if (unmatchedFiles.length) {
    console.log("Unmatched files:");
    for (const u of unmatchedFiles) console.log(`  ${u}`);
  }
  if (unmatchedBrands.length) {
    console.log("Brands without logo:");
    for (const u of unmatchedBrands) console.log(`  ${u}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
