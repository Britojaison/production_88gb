import { getFromMemory, setToMemory } from "@/lib/data-cache";
import { db, maybe, revive } from "@/lib/db";

async function loadUser(email: string) {
  const row = maybe(
    await db().from("users_slate").select("*").eq("email", email).maybeSingle(),
    "load user",
  );
  return row ? revive(row) : null;
}

export type DbUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

/**
 * DB user lookup by email with a 5-minute in-process cache.
 * Used on every request by the auth callback, so it must stay cheap.
 * Throws if the database is unreachable; returns null only when the user doesn't exist.
 */
export async function getDbUserByEmail(email: string): Promise<DbUser | null> {
  const norm = email.toLowerCase().trim();
  const key = `user:${norm}`;
  const cached = getFromMemory<DbUser | null>(key);
  if (cached !== undefined) return cached;

  const user = await loadUser(norm);
  if (user) setToMemory(key, user, 300);
  return user;
}
