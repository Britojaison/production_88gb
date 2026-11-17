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
  priority: string;
  dueDate: string;
  advancePaid: string;
  invoiceUrl: string;
  remarks: string;
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
    <form action={onSubmit} className="space-y-5" encType="multipart/form-data">
      {error ? (
        <p className="rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-ink)]">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className="field-label">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="field-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="field-label">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="amount" className="field-label">
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
            className="field-input amount"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoryId" className="field-label">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? ""}
            className="field-input"
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
          <label htmlFor="vendorId" className="field-label">
            Vendor directory (optional)
          </label>
          <select
            id="vendorId"
            name="vendorId"
            value={vendorId}
            onChange={(e) => onVendorChange(e.target.value)}
            className="field-input"
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
        <label htmlFor="paidTo" className="field-label">
          Paid to
        </label>
        <input
          id="paidTo"
          name="paidTo"
          required
          value={paidTo}
          onChange={(e) => setPaidTo(e.target.value)}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="vendorPaymentDetails" className="field-label">
          Vendor payment details
        </label>
        <textarea
          id="vendorPaymentDetails"
          name="vendorPaymentDetails"
          required
          rows={3}
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          className="field-input"
        />
      </div>

      <fieldset className="space-y-4 rounded-md border border-[var(--border)] p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Payment terms (optional)
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="dueDate" className="field-label">
              Due date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={initial?.dueDate ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="priority" className="field-label">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={initial?.priority ?? ""}
              className="field-input"
            >
              <option value="">Not set</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label htmlFor="advancePaid" className="field-label">
              Advance paid (INR)
            </label>
            <input
              id="advancePaid"
              name="advancePaid"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial?.advancePaid ?? ""}
              className="field-input amount"
            />
          </div>
        </div>
        <div>
          <label htmlFor="invoiceUrl" className="field-label">
            Invoice link
          </label>
          <input
            id="invoiceUrl"
            name="invoiceUrl"
            type="url"
            placeholder="https://drive.google.com/…"
            defaultValue={initial?.invoiceUrl ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="remarks" className="field-label">
            Remarks
          </label>
          <textarea
            id="remarks"
            name="remarks"
            rows={2}
            defaultValue={initial?.remarks ?? ""}
            className="field-input"
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="receipt" className="field-label">
          Receipt (image or PDF)
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-[var(--ink-muted)] file:mr-3 file:rounded file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--accent-ink)]"
        />
        {existingReceiptName ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
            <input type="checkbox" name="removeReceipt" className="accent-[var(--accent)]" />
            Remove current receipt ({existingReceiptName})
          </label>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
