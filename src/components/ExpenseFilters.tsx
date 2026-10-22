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
    paid?: string;
    from?: string;
    to?: string;
  };
  showStatus?: boolean;
}) {
  return (
    <form method="get" action={action} className="filter-bar !lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="field-label" htmlFor="filter-q">
          Search
        </label>
        <input
          id="filter-q"
          name="q"
          defaultValue={defaults?.q ?? ""}
          placeholder="Title, payee, shoot…"
          className="field-input"
        />
      </div>
      {showStatus ? (
        <div>
          <label className="field-label" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={defaults?.status ?? "ALL"}
            className="field-input"
          >
            <option value="ALL">All statuses</option>
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="field-label" htmlFor="filter-paid">
          Settlement
        </label>
        <select
          id="filter-paid"
          name="paid"
          defaultValue={defaults?.paid ?? "ALL"}
          className="field-input"
        >
          <option value="ALL">All (paid/unpaid)</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          name="categoryId"
          defaultValue={defaults?.categoryId ?? ""}
          className="field-input"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="filter-paidTo">
          Payee
        </label>
        <input
          id="filter-paidTo"
          name="paidTo"
          defaultValue={defaults?.paidTo ?? ""}
          placeholder="Contains…"
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="filter-from">
          From
        </label>
        <input
          id="filter-from"
          name="from"
          type="date"
          defaultValue={defaults?.from ?? ""}
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="filter-to">
          To
        </label>
        <input
          id="filter-to"
          name="to"
          type="date"
          defaultValue={defaults?.to ?? ""}
          className="field-input"
        />
      </div>
      <div className="flex items-end">
        <button type="submit" className="btn btn-primary w-full">
          Filter
        </button>
      </div>
    </form>
  );
}
