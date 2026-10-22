"use client";

import { useState } from "react";
import { shootStatusLabel } from "@/lib/format";
import {
  RANDOM_SHOOT_IMAGE,
  SHOOT_IMAGE_OPTIONS,
} from "@/lib/shoot-images";
import { SHOOT_STATUSES, type ShootStatus } from "@/lib/types";

type ShootFormValues = {
  name: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: ShootStatus;
  image: string;
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
    <form action={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Shoot name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Brand Film — Q4 Campaign"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">
          Brands / clients
        </p>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
          {brands.length === 0 ? (
            <p className="text-xs text-slate-500">No brands yet — add below.</p>
          ) : (
            brands.map((b) => (
              <label
                key={b.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="brandIds"
                  value={b.id}
                  checked={selected.includes(b.id)}
                  onChange={() => toggleBrand(b.id)}
                />
                <span>{b.name}</span>
              </label>
            ))
          )}
        </div>
        <label
          htmlFor="newBrands"
          className="mt-2 mb-1 block text-xs font-medium text-slate-600"
        >
          Add new brand(s) — comma-separated; saved to directory
        </label>
        <input
          id="newBrands"
          name="newBrands"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. New Client Co, Another Brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initial?.startDate ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            End date (optional)
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={initial?.endDate ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "PLANNED"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {SHOOT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {shootStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="image" className="mb-1 block text-sm font-medium text-slate-700">
            Card image
          </label>
          <select
            id="image"
            name="image"
            defaultValue={initial?.image ?? RANDOM_SHOOT_IMAGE}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={RANDOM_SHOOT_IMAGE}>Random from pool</option>
            {SHOOT_IMAGE_OPTIONS.map((path) => (
              <option key={path} value={path}>
                {path.replace("/images/", "")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="budget" className="mb-1 block text-sm font-medium text-slate-700">
          Budget INR (optional)
        </label>
        <input
          id="budget"
          name="budget"
          type="number"
          min="0"
          step="0.01"
          defaultValue={initial?.budget ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="50000"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Location, crew notes, client…"
        />
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
