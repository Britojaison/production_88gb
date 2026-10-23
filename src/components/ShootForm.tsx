"use client";

import { useState } from "react";
import { shootStatusLabel } from "@/lib/format";
import { SHOOT_STATUSES, type ShootStatus } from "@/lib/types";

type ShootFormValues = {
  name: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: ShootStatus;
  budget: string;
  brandIds: string[];
};

export function ShootForm({
  action,
  initial,
  submitLabel,
  brands,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initial?: Partial<ShootFormValues>;
  submitLabel: string;
  brands: Array<{ id: string; name: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string[]>(initial?.brandIds ?? []);

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

  function toggleBrand(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-ink)]">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="field-label">
          Shoot name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="field-input"
          placeholder="Brand Film — Q4 Campaign"
        />
      </div>

      <div>
        <p className="field-label">Brands / clients</p>
        <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
          {brands.length === 0 ? (
            <p className="px-1 py-1 text-xs text-[var(--ink-faint)]">
              No brands yet — add below.
            </p>
          ) : (
            brands.map((b) => (
              <label
                key={b.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-[var(--surface-raised)]"
              >
                <input
                  type="checkbox"
                  name="brandIds"
                  value={b.id}
                  checked={selected.includes(b.id)}
                  onChange={() => toggleBrand(b.id)}
                  className="accent-[var(--accent)]"
                />
                <span>{b.name}</span>
              </label>
            ))
          )}
        </div>
        <label htmlFor="newBrands" className="field-label mt-2.5">
          Add new brand(s) — comma-separated; saved to directory
        </label>
        <input
          id="newBrands"
          name="newBrands"
          className="field-input"
          placeholder="e.g. New Client Co, Another Brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="field-label">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initial?.startDate ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="field-label">
            End date (optional)
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={initial?.endDate ?? ""}
            className="field-input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "PLANNED"}
            className="field-input"
          >
            {SHOOT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {shootStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget" className="field-label">
            Budget INR (optional)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial?.budget ?? ""}
            className="field-input amount"
            placeholder="50000"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className="field-input"
          placeholder="Location, crew notes, client…"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
