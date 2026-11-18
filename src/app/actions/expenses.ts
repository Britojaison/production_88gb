"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { logExpenseAudit } from "@/lib/audit";
import { invalidateMemoryCache } from "@/lib/data-cache";
import { notifyAllManagement, notifyUsers } from "@/lib/notifications";
import { db, maybe, must, revive, toDb, type Update } from "@/lib/db";
import { requireDbUser } from "@/lib/session";
import { ExpenseStatus } from "@/lib/types";
import { deleteReceiptFile, saveReceiptFile } from "@/lib/uploads";
import { expenseFormSchema, rejectSchema } from "@/lib/validations";
import { resolveVendorForExpense } from "@/lib/vendors";

function parseExpenseForm(formData: FormData) {
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  return expenseFormSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    paidTo: formData.get("paidTo"),
    vendorPaymentDetails: formData.get("vendorPaymentDetails"),
    categoryId: formData.get("categoryId"),
    vendorId: vendorId || undefined,
    priority: formData.get("priority") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    advancePaid: formData.get("advancePaid") ?? "",
    invoiceUrl: formData.get("invoiceUrl") ?? "",
    remarks: formData.get("remarks") ?? "",
  });
}

function termsData(data: {
  amount: number;
  priority?: string;
  dueDate?: string;
  advancePaid?: number | "";
  invoiceUrl?: string;
  remarks?: string;
}) {
  const advance = typeof data.advancePaid === "number" ? data.advancePaid : null;
  return {
    priority: data.priority || null,
    dueDate: data.dueDate ? toDb(new Date(data.dueDate)) : null,
    advancePaid: advance,
    invoiceUrl: data.invoiceUrl || null,
    remarks: data.remarks || null,
  };
}

/** Expense row (dates revived) with its shoot's name, or null. */
async function loadExpense(id: string) {
  const row = maybe(
    await db()
      .from("expenses_slate")
      .select("*, shoot:shoots_slate(id, name)")
      .eq("id", id)
      .maybeSingle(),
    "load expense",
  );
  return row ? revive(row) : null;
}

async function updateExpenseRow(id: string, data: Update<"expenses_slate">) {
  must(await db().from("expenses_slate").update(data).eq("id", id), "update expense");
}

function revalidateShootPaths(shootId: string, expenseId?: string) {
  invalidateMemoryCache();
  try {
    revalidateTag("expenses", { expire: 0 });
    revalidateTag("shoots", { expire: 0 });
  } catch {
    // ignore outside active request context
  }
  revalidatePath("/shoots");
  revalidatePath(`/shoots/${shootId}`);
  if (expenseId) {
    revalidatePath(`/shoots/${shootId}/expenses/${expenseId}`);
  }
  revalidatePath("/management");
  revalidatePath("/notifications");
  revalidatePath("/vendors");
}

async function handleReceipt(
  formData: FormData,
  existing?: { path?: string | null; name?: string | null },
): Promise<
  | { receiptPath: string | null; receiptName: string | null }
  | { error: string }
> {
  const remove = formData.get("removeReceipt") === "on";
  const file = formData.get("receipt");

  if (remove) {
    await deleteReceiptFile(existing?.path);
    return { receiptPath: null, receiptName: null };
  }

  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveReceiptFile(file);
      await deleteReceiptFile(existing?.path);
      return {
        receiptPath: saved.relativePath,
        receiptName: saved.originalName,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  }

  return {
    receiptPath: existing?.path ?? null,
    receiptName: existing?.name ?? null,
  };
}

export async function createExpense(
  shootId: string,
  formData: FormData,
): Promise<{ error: string } | void> {
  const { user } = await requireDbUser("VIDEO_TEAM");
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const shoot = maybe(
    await db().from("shoots_slate").select("id").eq("id", shootId).maybeSingle(),
    "load shoot",
  );
  if (!shoot) {
    return { error: "Shoot not found" };
  }

  const receipt = await handleReceipt(formData);
  if ("error" in receipt) return receipt;

  const data = parsed.data;
  const vendorId = await resolveVendorForExpense({
    vendorId: data.vendorId,
    paidTo: data.paidTo,
    paymentDetails: data.vendorPaymentDetails,
  });

  const expense = must(
    await db()
      .from("expenses_slate")
      .insert({
        shootId,
        title: data.title,
        date: toDb(new Date(data.date)),
        amount: data.amount,
        paidTo: data.paidTo,
        vendorPaymentDetails: data.vendorPaymentDetails,
        categoryId: data.categoryId,
        vendorId,
        receiptPath: receipt.receiptPath,
        receiptName: receipt.receiptName,
        ...termsData(data),
        status: ExpenseStatus.DRAFT,
        submitterId: user.id,
      })
      .select("id")
      .single(),
    "create expense",
  );

  await logExpenseAudit({
    expenseId: expense.id,
    actorId: user.id,
    action: "CREATED",
    toStatus: ExpenseStatus.DRAFT,
  });

  revalidateShootPaths(shootId, expense.id);
  redirect(`/shoots/${shootId}/expenses/${expense.id}`);
}

export async function updateExpense(
  shootId: string,
  id: string,
  formData: FormData,
): Promise<{ error: string } | void> {
  const { user } = await requireDbUser("VIDEO_TEAM");
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await loadExpense(id);
  if (
    !existing ||
    existing.shootId !== shootId ||
    existing.submitterId !== user.id
  ) {
    return { error: "Expense not found" };
  }
  if (
    existing.status !== ExpenseStatus.DRAFT &&
    existing.status !== ExpenseStatus.REJECTED
  ) {
    return { error: "Only draft or rejected expenses can be edited" };
  }

  const receipt = await handleReceipt(formData, {
    path: existing.receiptPath,
    name: existing.receiptName,
  });
  if ("error" in receipt) return receipt;

  const data = parsed.data;
  const vendorId = await resolveVendorForExpense({
    vendorId: data.vendorId,
    paidTo: data.paidTo,
    paymentDetails: data.vendorPaymentDetails,
  });

  await updateExpenseRow(id, {
    title: data.title,
    date: toDb(new Date(data.date)),
    amount: data.amount,
    paidTo: data.paidTo,
    vendorPaymentDetails: data.vendorPaymentDetails,
    categoryId: data.categoryId,
    vendorId,
    receiptPath: receipt.receiptPath,
    receiptName: receipt.receiptName,
    ...termsData(data),
    status: ExpenseStatus.DRAFT,
    rejectionReason: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedById: null,
  });

  await logExpenseAudit({
    expenseId: id,
    actorId: user.id,
    action: "UPDATED",
    fromStatus: existing.status,
    toStatus: ExpenseStatus.DRAFT,
  });

  revalidateShootPaths(shootId, id);
  redirect(`/shoots/${shootId}/expenses/${id}`);
}

export async function submitExpense(
  shootId: string,
  id: string,
): Promise<void> {
  const { user } = await requireDbUser("VIDEO_TEAM");
  const existing = await loadExpense(id);

  if (
    !existing ||
    existing.shootId !== shootId ||
    existing.submitterId !== user.id
  ) {
    return;
  }
  if (
    existing.status !== ExpenseStatus.DRAFT &&
    existing.status !== ExpenseStatus.REJECTED
  ) {
    return;
  }

  await updateExpenseRow(id, {
    status: ExpenseStatus.SUBMITTED,
    submittedAt: toDb(new Date()),
    rejectionReason: null,
    reviewedAt: null,
    reviewedById: null,
  });

  await logExpenseAudit({
    expenseId: id,
    actorId: user.id,
    action: "SUBMITTED",
    fromStatus: existing.status,
    toStatus: ExpenseStatus.SUBMITTED,
  });

  await notifyAllManagement({
    type: "EXPENSE_SUBMITTED",
    title: "Expense submitted for review",
    body: `${user.name} submitted “${existing.title}” on ${existing.shoot.name}.`,
    href: `/management/${id}`,
    expenseId: id,
  });

  revalidateShootPaths(shootId, id);
  redirect(`/shoots/${shootId}/expenses/${id}`);
}

export async function approveExpense(id: string): Promise<void> {
  const { user } = await requireDbUser("MANAGEMENT");
  const existing = await loadExpense(id);

  if (!existing || existing.status !== ExpenseStatus.SUBMITTED) {
    return;
  }

  await updateExpenseRow(id, {
    status: ExpenseStatus.APPROVED,
    reviewedAt: toDb(new Date()),
    reviewedById: user.id,
    rejectionReason: null,
  });

  await logExpenseAudit({
    expenseId: id,
    actorId: user.id,
    action: "APPROVED",
    fromStatus: ExpenseStatus.SUBMITTED,
    toStatus: ExpenseStatus.APPROVED,
  });

  await notifyUsers({
    userIds: [existing.submitterId],
    type: "EXPENSE_APPROVED",
    title: "Expense approved",
    body: `“${existing.title}” on ${existing.shoot.name} was approved.`,
    href: `/shoots/${existing.shootId}/expenses/${id}`,
    expenseId: id,
  });

  revalidateShootPaths(existing.shootId, id);
  revalidatePath(`/management/${id}`);
  redirect("/management");
}

export async function rejectExpense(
  id: string,
  formData: FormData,
): Promise<void> {
  const { user } = await requireDbUser("MANAGEMENT");
  const parsed = rejectSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return;
  }

  const existing = await loadExpense(id);
  if (!existing || existing.status !== ExpenseStatus.SUBMITTED) {
    return;
  }

  await updateExpenseRow(id, {
    status: ExpenseStatus.REJECTED,
    rejectionReason: parsed.data.reason,
    reviewedAt: toDb(new Date()),
    reviewedById: user.id,
  });

  await logExpenseAudit({
    expenseId: id,
    actorId: user.id,
    action: "REJECTED",
    fromStatus: ExpenseStatus.SUBMITTED,
    toStatus: ExpenseStatus.REJECTED,
    note: parsed.data.reason,
  });

  await notifyUsers({
    userIds: [existing.submitterId],
    type: "EXPENSE_REJECTED",
    title: "Expense rejected",
    body: `“${existing.title}” on ${existing.shoot.name} was rejected: ${parsed.data.reason}`,
    href: `/shoots/${existing.shootId}/expenses/${id}`,
    expenseId: id,
  });

  revalidateShootPaths(existing.shootId, id);
  revalidatePath(`/management/${id}`);
  redirect("/management");
}

export async function deleteDraft(
  shootId: string,
  id: string,
): Promise<void> {
  const { user } = await requireDbUser("VIDEO_TEAM");

  const existing = await loadExpense(id);
  if (
    !existing ||
    existing.shootId !== shootId ||
    existing.submitterId !== user.id
  ) {
    return;
  }
  if (existing.status !== ExpenseStatus.DRAFT) {
    return;
  }

  await deleteReceiptFile(existing.receiptPath);
  must(await db().from("expenses_slate").delete().eq("id", id), "delete expense");
  revalidateShootPaths(shootId);
  redirect(`/shoots/${shootId}`);
}

/** Management-only: toggle settlement `paid` (not payee / paidTo). */
export async function setExpensePaid(
  id: string,
  paid: boolean,
): Promise<void> {
  const { user } = await requireDbUser("MANAGEMENT");
  const existing = await loadExpense(id);
  if (!existing) return;
  // Money only goes out on approved work. Undoing a payment is always allowed.
  if (paid && existing.status !== ExpenseStatus.APPROVED) return;

  await updateExpenseRow(id, {
    paid,
    paidAt: paid ? toDb(new Date()) : null,
  });

  await logExpenseAudit({
    expenseId: id,
    actorId: user.id,
    action: paid ? "MARKED_PAID" : "MARKED_UNPAID",
    note: paid ? "Settlement marked paid" : "Settlement marked unpaid",
  });

  revalidateShootPaths(existing.shootId, id);
  revalidatePath(`/management/${id}`);
  revalidatePath("/management");
}
