import type { ReactNode } from "react";
import { AppChrome } from "@/components/AppChrome";
import { getFromMemory, setToMemory } from "@/lib/data-cache";
import { db, must } from "@/lib/db";
import { getSession, getDbUserByEmail } from "@/lib/session";
import type { Role } from "@/lib/types";

async function getUnreadNotificationCount(userId: string) {
  const key = `unread-notifications:${userId}`;
  const cached = getFromMemory<number>(key);
  if (cached !== undefined) return cached;

  const res = await db()
    .from("notifications_slate")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("read", false);
  must(res, "count notifications");
  const count = res.count ?? 0;
  return setToMemory(key, count, 30); // 30s TTL
}

export async function AppShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: ReactNode;
}) {
  const session = await getSession();
  let unread = 0;
  let email = session?.user?.email ?? undefined;
  if (session?.user?.email) {
    const user = await getDbUserByEmail(session.user.email);
    if (user) {
      email = user.email;
      unread = await getUnreadNotificationCount(user.id);
    }
  }

  return (
    <AppChrome name={name} role={role} email={email} unread={unread}>
      {children}
    </AppChrome>
  );
}
