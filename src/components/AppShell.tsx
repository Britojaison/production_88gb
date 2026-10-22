import type { ReactNode } from "react";
import { AppChrome } from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/types";

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, email: true },
    });
    if (user) {
      email = user.email;
      unread = await prisma.notification.count({
        where: { userId: user.id, read: false },
      });
    }
  }

  return (
    <AppChrome name={name} role={role} email={email} unread={unread}>
      {children}
    </AppChrome>
  );
}
