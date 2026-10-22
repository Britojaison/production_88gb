import { createCategory } from "@/app/actions/categories";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function CategoriesPage() {
  const session = await requireRole("MANAGEMENT");
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
        <form action={createCategory} className="mt-4 flex gap-2">
          <input
            name="name"
            required
            placeholder="New category name"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Add
          </button>
        </form>
        <ul className="mt-6 divide-y rounded-lg border border-slate-200 bg-white text-sm">
          {categories.map((c) => (
            <li key={c.id} className="px-3 py-2">
              {c.name}{" "}
              <span className="text-slate-400">({c.slug})</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
