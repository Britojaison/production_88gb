import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

/**
 * Dev HMR can keep an old PrismaClient on globalThis from before new models
 * (e.g. Category) existed — then `prisma.category` is undefined and `.findMany` throws.
 * Recreate when expected delegates are missing.
 */
function getPrismaClient() {
  const existing = globalForPrisma.prisma;
  if (
    existing &&
    typeof (existing as { category?: { findMany?: unknown } }).category
      ?.findMany === "function" &&
    typeof (existing as { expense?: { findMany?: unknown } }).expense
      ?.findMany === "function" &&
    typeof (existing as { brand?: { findMany?: unknown } }).brand
      ?.findMany === "function"
  ) {
    return existing;
  }
  return createPrismaClient();
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
