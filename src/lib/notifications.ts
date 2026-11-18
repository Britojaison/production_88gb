import { db, must } from "@/lib/db";

/**
 * Optional SMTP hook — set SMTP_* env vars later to enable email.
 * Currently logs only; does not block in-app notifications.
 */
export async function sendEmailStub(opts: {
  to: string;
  subject: string;
  body: string;
}) {
  if (process.env.SMTP_HOST) {
    console.info(
      "[email-stub] SMTP configured but not wired; would send:",
      opts.to,
      opts.subject,
    );
  } else {
    console.info("[email-stub]", opts.to, opts.subject);
  }
}

export async function notifyUsers(opts: {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  href?: string;
  expenseId?: string;
}) {
  if (opts.userIds.length === 0) return;

  must(
    await db()
      .from("notifications_slate")
      .insert(
        opts.userIds.map((userId) => ({
          userId,
          type: opts.type,
          title: opts.title,
          body: opts.body,
          href: opts.href ?? null,
          expenseId: opts.expenseId ?? null,
        })),
      ),
    "create notifications",
  );

  const users = must(
    await db().from("users_slate").select("email").in("id", opts.userIds),
    "load notified users",
  );
  await Promise.all(
    users.map((u) =>
      sendEmailStub({
        to: u.email,
        subject: opts.title,
        body: opts.body,
      }),
    ),
  );
}

export async function notifyAllManagement(opts: {
  type: string;
  title: string;
  body: string;
  href?: string;
  expenseId?: string;
}) {
  const managers = must(
    await db().from("users_slate").select("id").eq("role", "MANAGEMENT"),
    "load managers",
  );
  await notifyUsers({
    userIds: managers.map((m) => m.id),
    ...opts,
  });
}
