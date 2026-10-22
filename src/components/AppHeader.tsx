import Link from "next/link";
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={home} className="text-lg font-semibold text-slate-900">
            88GB Production Expenses
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {role === "VIDEO_TEAM" ? (
              <>
                <Link href="/shoots" className="text-slate-600 hover:text-slate-900">
                  Shoots
                </Link>
                <Link href="/shoots/new" className="text-slate-600 hover:text-slate-900">
                  New shoot
                </Link>
                <Link href="/vendors" className="text-slate-600 hover:text-slate-900">
                  Vendors
                </Link>
                <Link href="/brands" className="text-slate-600 hover:text-slate-900">
                  Brands
                </Link>
              </>
            ) : (
              <>
                <Link href="/management" className="text-slate-600 hover:text-slate-900">
                  Reviews
                </Link>
                <Link
                  href="/management/users"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Users
                </Link>
                <Link
                  href="/management/categories"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Categories
                </Link>
                <Link href="/vendors" className="text-slate-600 hover:text-slate-900">
                  Vendors
                </Link>
                <Link href="/brands" className="text-slate-600 hover:text-slate-900">
                  Brands
                </Link>
              </>
            )}
            <Link href="/notifications" className="text-slate-600 hover:text-slate-900">
              Alerts{unread > 0 ? ` (${unread})` : ""}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {name}{" "}
            <span className="text-slate-400">
              ({role === "MANAGEMENT" ? "management" : "video team"})
            </span>
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
