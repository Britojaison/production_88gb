import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { buildExpenseWhere } from "@/lib/expense-query";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
  const url = new URL(request.url);

  const where = buildExpenseWhere({
    shootId: id,
    q: url.searchParams.get("q"),
    status: url.searchParams.get("status"),
    categoryId: url.searchParams.get("categoryId"),
    paidTo: url.searchParams.get("paidTo"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (session.user.role === "VIDEO_TEAM") {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    where.submitterId = dbUser.id;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true, shoot: true },
    orderBy: { date: "asc" },
  });

  const csv = toCsv(
    [
      "Title",
      "Date",
      "Amount",
      "Paid To",
      "Category",
      "Status",
      "Payment Details",
      "Shoot",
    ],
    expenses.map((e) => [
      e.title,
      e.date.toISOString().slice(0, 10),
      e.amount,
      e.paidTo,
      e.category?.name ?? "",
      e.status,
      e.vendorPaymentDetails,
      e.shoot.name,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shoot-${id}-expenses.csv"`,
    },
  });
}
