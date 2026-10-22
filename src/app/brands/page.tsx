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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Brands / clients
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Directory for shoot clients. Pick on create/edit shoot, or add new
          names there — they save here automatically.
        </p>

        <form
          action={createBrand}
          className="mt-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4"
        >
          <input
            name="name"
            required
            placeholder="Brand / client name"
            className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Add brand
          </button>
        </form>

        <ul className="mt-6 space-y-2">
          {brands.length === 0 ? (
            <li className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              No brands yet.
            </li>
          ) : (
            brands.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-900">{b.name}</span>
                <span className="text-xs text-slate-500">
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
