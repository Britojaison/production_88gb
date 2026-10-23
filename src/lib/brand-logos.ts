/**
 * Client logos under `public/client-logos/` (renamed from `public/client logos`).
 * Paths are public URL paths. Matching is case-insensitive / alias-aware.
 */

export type BrandLogoMapping = {
  /** Public path e.g. /client-logos/cinco.png */
  path: string;
  /** Original filename as added by the user */
  sourceFile: string;
  /** Canonical Brand.name in DB */
  brandName: string;
};

/** Explicit filename → brand map (do not invent unmatched pairs). */
export const BRAND_LOGO_FILES: BrandLogoMapping[] = [
  {
    path: "/client-logos/cinco.png",
    sourceFile: "cinco.png",
    brandName: "Cinco",
  },
  {
    path: "/client-logos/milkymist.png",
    sourceFile: "milkymist.png",
    brandName: "MilkymistD",
  },
  {
    path: "/client-logos/mmwear.png",
    sourceFile: "mmwear.png",
    brandName: "MM wear",
  },
  {
    path: "/client-logos/sathya.png",
    sourceFile: "sathya.png",
    brandName: "Sathya",
  },
  {
    path: "/client-logos/super-saravana-stores.png",
    sourceFile: "Super Saravana Stores.png",
    brandName: "Super Saravana Stores",
  },
  {
    path: "/client-logos/vvr.png",
    sourceFile: "vvr.png",
    brandName: "VVR Groups",
  },
];

/** Extra aliases → canonical Brand.name (same spirit as CSV import). */
const BRAND_NAME_ALIASES: Record<string, string> = {
  "milky mist": "MilkymistD",
  milkymistd: "MilkymistD",
  mmd: "MilkymistD",
  milkymist: "MilkymistD",
  "mm wear": "MM wear",
  mmwear: "MM wear",
  "mm wearment": "MM wear",
  sss: "Super Saravana Stores",
  "super saravana stores": "Super Saravana Stores",
  cinco: "Cinco",
  sathya: "Sathya",
  "vvr groups": "VVR Groups",
  "vvr group": "VVR Groups",
  vvr: "VVR Groups",
};

export function normalizeBrandKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function canonicalBrandName(name: string): string {
  const key = normalizeBrandKey(name);
  return BRAND_NAME_ALIASES[key] ?? name.trim();
}

export function logoPathForBrandName(name: string): string | null {
  const canonical = canonicalBrandName(name);
  const hit = BRAND_LOGO_FILES.find(
    (row) => normalizeBrandKey(row.brandName) === normalizeBrandKey(canonical),
  );
  return hit?.path ?? null;
}

/** Quiet monogram letters from a brand name (no stock photos). */
export function brandMonogram(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}
