import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { buildExpenseWhere } from "@/lib/expense-query";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const instant = false;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "MANAGEMENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  const where = buildExpenseWhere({
    q: url.searchParams.get("q"),
    status: url.searchParams.get("status") || "SUBMITTED",
    categoryId: url.searchParams.get("categoryId"),
    paidTo: url.searchParams.get("paidTo"),
    paid: url.searchParams.get("paid"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: true,
      shoot: true,
      submitter: { select: { name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const csv = toCsv(
    [
      "Shoot",
      "Title",
      "Date",
      "Amount",
      "Paid To",
      "Category",
      "Status",
      "Paid",
      "Paid At",
      "Submitter",
      "Submitted At",
    ],
    expenses.map((e) => [
      e.shoot.name,
      e.title,
      e.date.toISOString().slice(0, 10),
      e.amount,
      e.paidTo,
      e.category?.name ?? "",
      e.status,
      e.paid ? "Yes" : "No",
      e.paidAt?.toISOString() ?? "",
      e.submitter.name,
      e.submittedAt?.toISOString() ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="management-expenses.csv"',
    },
  });
}
