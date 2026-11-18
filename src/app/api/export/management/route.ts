import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { outstandingAmount } from "@/lib/payment-terms";
import { listExpenses } from "@/lib/expense-query";
import { getSession } from "@/lib/session";

export const instant = false;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "MANAGEMENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  const status = url.searchParams.get("status") || "ALL";
  const paid = url.searchParams.get("paid") || "UNPAID";
  const expenses = await listExpenses(
    {
      q: url.searchParams.get("q"),
      status,
      // Review queue never shows drafts unless explicitly filtered
      statusIn: ["SUBMITTED", "APPROVED", "REJECTED"],
      categoryId: url.searchParams.get("categoryId"),
      paidTo: url.searchParams.get("paidTo"),
      paid,
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    },
    [{ column: "submittedAt", ascending: true }],
  );

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
      "Advance Paid",
      "Outstanding",
      "Due Date",
      "Priority",
      "Invoice Link",
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
      e.advancePaid ?? "",
      outstandingAmount(e),
      e.dueDate?.toISOString().slice(0, 10) ?? "",
      e.priority ?? "",
      e.invoiceUrl ?? "",
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
