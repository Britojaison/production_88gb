import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { outstandingAmount } from "@/lib/payment-terms";
import { listExpenses } from "@/lib/expense-query";
import { getDbUserByEmail } from "@/lib/user-lookup";
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

  let submitterId: string | undefined;
  if (session.user.role === "VIDEO_TEAM") {
    const dbUser = await getDbUserByEmail(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    submitterId = dbUser.id;
  }

  const expenses = await listExpenses(
    {
      shootId: id,
      submitterId,
      q: url.searchParams.get("q"),
      status: url.searchParams.get("status"),
      categoryId: url.searchParams.get("categoryId"),
      paidTo: url.searchParams.get("paidTo"),
      paid: url.searchParams.get("paid"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    },
    [{ column: "date", ascending: true }],
  );

  const csv = toCsv(
    [
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
      e.paid ? "Yes" : "No",
      e.paidAt?.toISOString() ?? "",
      e.advancePaid ?? "",
      outstandingAmount(e),
      e.dueDate?.toISOString().slice(0, 10) ?? "",
      e.priority ?? "",
      e.invoiceUrl ?? "",
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
