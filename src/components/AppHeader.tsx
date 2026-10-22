import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/types";

export async function AppHeader({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  const home = role === "MANAGEMENT" ? "/management" : "/shoots";
  const session = await getSession();
  let unread = 0;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true },
    });
    if (user) {
      unread = await prisma.notification.count({
        where: { userId: user.id, read: false },
      });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <Link
            href={home}
            className="shrink-0 text-[0.95rem] font-semibold tracking-tight text-[var(--ink)]"
          >
            <span className="text-[var(--accent)]">88GB</span>{" "}
            <span className="font-medium text-[var(--ink-muted)]">Expenses</span>
          </Link>
          <NavLinks role={role} unread={unread} />
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
          <span className="hidden sm:inline">
            {name}{" "}
            <span className="text-[var(--ink-faint)]">
              · {role === "MANAGEMENT" ? "management" : "video team"}
            </span>
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
