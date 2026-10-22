/** Assets available under `public/images` (all 11 files). */
export const SHOOT_IMAGE_OPTIONS = [
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
  "/images/5.png",
  "/images/6.png",
  "/images/7.png",
  "/images/8.png",
  "/images/9.png",
  "/images/10.png",
  "/images/11.png",
] as const;

export type ShootImagePath = (typeof SHOOT_IMAGE_OPTIONS)[number];

/** Sentinel for forms: server will pick a random pool image. */
export const RANDOM_SHOOT_IMAGE = "__random__";

/** Pick a random image from the full pool (create / seed). */
export function randomShootImage(): ShootImagePath {
  const index = Math.floor(Math.random() * SHOOT_IMAGE_OPTIONS.length);
  return SHOOT_IMAGE_OPTIONS[index]!;
}

/** Stable pick from the pool when a shoot has no stored image (same id → same image). */
export function stableShootImage(seed: string): ShootImagePath {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SHOOT_IMAGE_OPTIONS[hash % SHOOT_IMAGE_OPTIONS.length]!;
}

/**
 * Resolve display path: use stored path if valid; otherwise a stable pool pick
 * keyed by `fallbackSeed` (usually shoot id) so reloads don't flicker.
 */
export function shootImageSrc(
  image: string | null | undefined,
  fallbackSeed = "default",
): string {
  if (image && SHOOT_IMAGE_OPTIONS.includes(image as ShootImagePath)) {
    return image;
  }
  if (image?.startsWith("/images/") && image.endsWith(".png")) {
    return image;
  }
  return stableShootImage(fallbackSeed);
}
