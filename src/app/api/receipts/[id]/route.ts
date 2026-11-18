import { NextResponse } from "next/server";
import { db, maybe } from "@/lib/db";
import { getSession } from "@/lib/session";
import { resolveReceiptUrl } from "@/lib/uploads";

export const instant = false;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const expense = maybe(
    await db()
      .from("expenses_slate")
      .select("receiptPath, submitterId")
      .eq("id", id)
      .maybeSingle(),
    "load receipt",
  );

  const canView =
    expense &&
    (session.user.role === "MANAGEMENT" || expense.submitterId === session.user.id);
  if (!canView || !expense.receiptPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await resolveReceiptUrl(expense.receiptPath);
  if (!url) {
    return NextResponse.json({ error: "Receipt unavailable" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(url, request.url));
}
