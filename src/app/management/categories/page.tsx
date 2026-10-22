import { createCategory } from "@/app/actions/categories";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function CategoriesPage() {
  const session = await requireRole("MANAGEMENT");
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <h1 className="page-title">Categories</h1>
        <p className="page-lead">Expense roles used across shoots.</p>
        <form
          action={createCategory}
          className="panel panel-pad mt-4 flex flex-wrap items-end gap-2"
        >
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="cat-name" className="field-label">
              New category
            </label>
            <input
              id="cat-name"
              name="name"
              required
              placeholder="Category name"
              className="field-input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
        <ul className="panel mt-6 divide-y divide-[var(--border)] text-sm">
          {categories.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
              <span className="font-medium text-[var(--ink)]">{c.name}</span>
              <span className="text-xs text-[var(--ink-faint)]">{c.slug}</span>
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
