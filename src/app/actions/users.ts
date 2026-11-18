"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db, maybe, must } from "@/lib/db";
import { requireDbUser } from "@/lib/session";
import { userFormSchema } from "@/lib/validations";

export async function createUser(formData: FormData): Promise<void> {
  await requireDbUser("MANAGEMENT");
  const parsed = userFormSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = maybe(
    await db().from("users_slate").select("id").eq("email", email).maybeSingle(),
    "check user",
  );
  if (existing) {
    return;
  }

  must(
    await db().from("users_slate").insert({
      email,
      name: parsed.data.name,
      passwordHash: await hash(parsed.data.password, 10),
      role: parsed.data.role,
    }),
    "create user",
  );

  revalidatePath("/management/users");
}
