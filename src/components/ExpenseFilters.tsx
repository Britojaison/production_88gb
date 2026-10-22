import { EXPENSE_STATUSES } from "@/lib/types";

export function ExpenseFilters({
  action,
  categories,
  defaults,
  showStatus = true,
}: {
  action: string;
  categories: Array<{ id: string; name: string }>;
  defaults?: {
    q?: string;
    status?: string;
    categoryId?: string;
    paidTo?: string;
    from?: string;
    to?: string;
  };
  showStatus?: boolean;
}) {
  return (
    <form
      method="get"
      action={action}
      className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6"
    >
      <input
        name="q"
        defaultValue={defaults?.q ?? ""}
        placeholder="Search title / payee / shoot"
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2"
      />
      {showStatus ? (
        <select
          name="status"
          defaultValue={defaults?.status ?? "ALL"}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {EXPENSE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : null}
      <select
        name="categoryId"
        defaultValue={defaults?.categoryId ?? ""}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="paidTo"
        defaultValue={defaults?.paidTo ?? ""}
        placeholder="Payee contains…"
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <input
        name="from"
        type="date"
        defaultValue={defaults?.from ?? ""}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <input
        name="to"
        type="date"
        defaultValue={defaults?.to ?? ""}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 sm:col-span-2 lg:col-span-1"
      >
        Filter
      </button>
    </form>
  );
}
