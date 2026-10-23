import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/login");
  }
  return session;
}

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
 * Resolve the authenticated user from the DB by email.
 * JWT `id` can go stale after `db:setup` reseeds; email is the stable key.
 */
export async function requireDbUser(role?: Role) {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
  });

  if (!user) {
    redirect("/login");
  }

  if (role && user.role !== role) {
    redirect(user.role === "MANAGEMENT" ? "/management" : "/shoots");
  }

  return { session, user };
}
