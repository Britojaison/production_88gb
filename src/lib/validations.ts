import { z } from "zod";
import { EXPENSE_STATUSES, ROLES, SHOOT_STATUSES } from "@/lib/types";

export const expenseFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paidTo: z.string().trim().min(1, "Paid-to is required").max(200),
  vendorPaymentDetails: z
    .string()
    .trim()
    .min(1, "Vendor payment details are required")
    .max(2000),
  categoryId: z.string().min(1, "Category is required"),
  vendorId: z.string().optional(),
});

export const shootFormSchema = z
  .object({
    name: z.string().trim().min(1, "Shoot name is required").max(200),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    notes: z.string().trim().max(2000).optional(),
    status: z.enum(SHOOT_STATUSES),
    budget: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after start date",
        path: ["endDate"],
      });
    }
  });

export const rejectSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required").max(1000),
});

export const userFormSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(100),
  role: z.enum(ROLES),
});

export const vendorFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  paymentDetails: z.string().trim().min(1).max(2000),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const expenseFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum([...EXPENSE_STATUSES, "ALL"] as const).optional(),
  categoryId: z.string().optional(),
  paidTo: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
