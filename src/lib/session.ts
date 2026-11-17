import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getFromMemory, setToMemory } from "@/lib/data-cache";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

/**
 * Deduplicated session lookup (per request lifecycle).
 */
export const getSession = cache(async () => {
  return getServerSession(authOptions);
});

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/login");
  }
  return session;
});

export async function requireRole(role: Role) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect(session.user.role === "MANAGEMENT" ? "/management" : "/shoots");
  }
  return session;
}

/** Allow any of the listed roles (e.g. shoot detail for team + management). */
export async function requireAnyRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as Role)) {
    redirect(session.user.role === "MANAGEMENT" ? "/management" : "/shoots");
  }
  return session;
}

/**
 * Deduplicated DB user lookup by email with Node process in-memory caching.
 * Prevents hitting Tokyo on every navigation back.
 */
export async function getDbUserByEmail(email: string) {
  const norm = email.toLowerCase().trim();
  const key = `user:${norm}`;
  const cached = getFromMemory<Awaited<ReturnType<typeof prisma.user.findUnique>>>(key);
  if (cached !== undefined) return cached;

  const user = await prisma.user.findUnique({
    where: { email: norm },
  });
  if (user) {
    setToMemory(key, user, 300); // 5 min TTL
  }
  return user;
}

/**
 * Resolve the authenticated user from the DB by email.
 * JWT `id` can go stale after `db:setup` reseeds; email is the stable key.
 */
export async function requireDbUser(role?: Role) {
  const session = await requireSession();
  const user = await getDbUserByEmail(session.user.email);

  if (!user) {
    redirect("/login");
  }

  if (role && user.role !== role) {
    redirect(user.role === "MANAGEMENT" ? "/management" : "/shoots");
  }

  return { session, user };
}
