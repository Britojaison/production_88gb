import Link from "next/link";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { AppHeader } from "@/components/AppHeader";
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
    <>
      <AppHeader name={user.name} role={user.role as Role} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              Mark all read
            </button>
          </form>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-600">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read
                    ? "border-slate-200 bg-white"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <p className="text-slate-700">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(n.createdAt)}
                    </p>
                    {n.href ? (
                      <Link href={n.href} className="mt-1 inline-block underline">
                        Open
                      </Link>
                    ) : null}
                  </div>
                  {!n.read ? (
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button type="submit" className="text-xs underline">
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
    </>
  );
}
