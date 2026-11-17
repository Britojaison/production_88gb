import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const instant = false;

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "MANAGEMENT") {
    redirect("/dashboard");
  }

  redirect("/shoots");
}
