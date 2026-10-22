import { createBrand } from "@/app/actions/brands";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import type { Role } from "@/lib/types";

export const instant = false;

export default async function BrandsPage() {
  const { user } = await requireDbUser();
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { shoots: true } } },
  });

  return (
    <>
      <AppHeader name={user.name} role={user.role as Role} />
      <main className="page-shell page-enter max-w-3xl">
        <h1 className="page-title">Brands / clients</h1>
        <p className="page-lead">
          Directory for shoot clients. Pick on create/edit shoot, or add new
          names there — they save here automatically.
        </p>

        <form
          action={createBrand}
          className="panel panel-pad mt-6 flex flex-wrap items-end gap-2"
        >
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="brand-name" className="field-label">
              Brand / client name
            </label>
            <input
              id="brand-name"
              name="name"
              required
              placeholder="Brand / client name"
              className="field-input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add brand
          </button>
        </form>

        <ul className="mt-6 space-y-2">
          {brands.length === 0 ? (
            <li className="panel-dashed p-6 text-center text-sm text-[var(--ink-muted)]">
              No brands yet.
            </li>
          ) : (
            brands.map((b) => (
              <li
                key={b.id}
                className="panel flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-[var(--ink)]">{b.name}</span>
                <span className="text-xs text-[var(--ink-faint)]">
                  {b._count.shoots === 1
                    ? "1 shoot"
                    : `${b._count.shoots} shoots`}
                </span>
              </li>
            ))
          )}
        </ul>
      </main>
    </>
  );
}
