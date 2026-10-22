import { prisma } from "@/lib/prisma";

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

  await prisma.notification.createMany({
    data: opts.userIds.map((userId) => ({
      userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      href: opts.href,
      expenseId: opts.expenseId,
    })),
  });

  const users = await prisma.user.findMany({
    where: { id: { in: opts.userIds } },
    select: { email: true },
  });
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
  const managers = await prisma.user.findMany({
    where: { role: "MANAGEMENT" },
    select: { id: true },
  });
  await notifyUsers({
    userIds: managers.map((m) => m.id),
    ...opts,
  });
}
