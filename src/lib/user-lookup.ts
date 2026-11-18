import { getFromMemory, setToMemory } from "@/lib/data-cache";
import { prisma } from "@/lib/prisma";

/**
 * DB user lookup by email with a 5-minute in-process cache.
 * Used on every request by the auth callback, so it must stay cheap.
 * Throws if the database is unreachable; returns null only when the user doesn't exist.
 */
export async function getDbUserByEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const key = `user:${norm}`;
  const cached = getFromMemory<Awaited<ReturnType<typeof prisma.user.findUnique>>>(key);
  if (cached !== undefined) return cached;

  const user = await prisma.user.findUnique({ where: { email: norm } });
  if (user) {
    setToMemory(key, user, 300);
  }
  return user;
}
