"use client";

import { useState } from "react";

type CategoryOption = { id: string; name: string };
type VendorOption = { id: string; name: string; paymentDetails: string };

type ExpenseFormValues = {
  title: string;
  date: string;
  amount: string;
  paidTo: string;
  vendorPaymentDetails: string;
  categoryId: string;
  vendorId: string;
};

export function ExpenseForm({
  action,
  initial,
  submitLabel,
  categories,
  vendors,
  existingReceiptName,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initial?: Partial<ExpenseFormValues>;
  submitLabel: string;
  categories: CategoryOption[];
  vendors: VendorOption[];
  existingReceiptName?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [paidTo, setPaidTo] = useState(initial?.paidTo ?? "");
  const [paymentDetails, setPaymentDetails] = useState(
    initial?.vendorPaymentDetails ?? "",
  );
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? "");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  function onVendorChange(id: string) {
    setVendorId(id);
    if (!id) return;
    const vendor = vendors.find((v) => v.id === id);
    if (!vendor) return;
    setPaidTo(vendor.name);
    setPaymentDetails(vendor.paymentDetails);
  }

  return (
    <form action={onSubmit} className="space-y-4" encType="multipart/form-data">
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
            Amount (INR)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={initial?.amount ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="categoryId"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="vendorId"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Vendor directory (optional)
          </label>
          <select
            id="vendorId"
            name="vendorId"
            value={vendorId}
            onChange={(e) => onVendorChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">One-off / custom payee</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="paidTo" className="mb-1 block text-sm font-medium text-slate-700">
          Paid to
        </label>
        <input
          id="paidTo"
          name="paidTo"
          required
          value={paidTo}
          onChange={(e) => setPaidTo(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="vendorPaymentDetails"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Vendor payment details
        </label>
        <textarea
          id="vendorPaymentDetails"
          name="vendorPaymentDetails"
          required
          rows={3}
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="receipt" className="mb-1 block text-sm font-medium text-slate-700">
          Receipt (image or PDF)
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-slate-600"
        />
        {existingReceiptName ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="removeReceipt" />
            Remove current receipt ({existingReceiptName})
          </label>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
