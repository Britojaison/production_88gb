"use server";

import { revalidatePath } from "next/cache";
import { db, must } from "@/lib/db";
import { requireDbUser } from "@/lib/session";

export async function markNotificationRead(id: string) {
  const { user } = await requireDbUser();
  must(
    await db().from("notifications_slate").update({ read: true }).eq("id", id).eq("userId", user.id),
    "mark notification read",
  );
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const { user } = await requireDbUser();
  must(
    await db()
      .from("notifications_slate")
      .update({ read: true })
      .eq("userId", user.id)
      .eq("read", false),
    "mark all notifications read",
  );
  revalidatePath("/notifications");
}
