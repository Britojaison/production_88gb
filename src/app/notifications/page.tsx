import Link from "next/link";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { AppShell } from "@/components/AppShell";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import type { Role } from "@/lib/types";

export const instant = false;

export default async function NotificationsPage() {
  const { user } = await requireDbUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell name={user.name} role={user.role as Role} >
      <main className="page-shell page-enter max-w-3xl">
        <div className="page-header">
          <h1 className="page-title">Notifications</h1>
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn btn-secondary">
              Mark all read
            </button>
          </form>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`panel px-3.5 py-2.5 text-sm ${
                  n.read
                    ? ""
                    : "border-[color-mix(in_srgb,var(--warn-ink)_25%,var(--border))] bg-[var(--warn-bg)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold tracking-tight text-[var(--ink)]">
                      {n.title}
                    </p>
                    <p className="text-[var(--ink-muted)]">{n.body}</p>
                    <p className="mt-1 text-xs text-[var(--ink-faint)]">
                      {formatDate(n.createdAt)}
                    </p>
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="mt-1 inline-block text-[var(--accent-ink)] underline"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                  {!n.read ? (
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="text-xs text-[var(--accent-ink)] underline"
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
