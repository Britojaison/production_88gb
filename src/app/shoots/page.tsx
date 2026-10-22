import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ShootCard } from "@/components/ShootCard";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { SHOOT_STATUSES } from "@/lib/types";

export const instant = false;

export default async function ShootsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireRole("VIDEO_TEAM");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status && params.status !== "ALL" ? params.status : undefined;

  const [shoots, totals] = await Promise.all([
    prisma.shoot.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { notes: { contains: q } },
                { brands: { some: { brand: { name: { contains: q } } } } },
              ],
            }
          : {}),
      },
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { expenses: true } },
        brands: { include: { brand: true }, orderBy: { brand: { name: "asc" } } },
      },
    }),
    prisma.expense.groupBy({
      by: ["shootId"],
      _sum: { amount: true },
    }),
  ]);

  const totalByShoot = new Map(
    totals.map((row) => [row.shootId, row._sum.amount ?? 0]),
  );

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Shoots</h1>
            <p className="text-sm text-slate-600">
              Open a shoot to manage its expenses.
            </p>
          </div>
          <Link
            href="/shoots/new"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New shoot
          </Link>
        </div>

        <form
          method="get"
          className="mb-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search shoots…"
            className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            name="status"
            defaultValue={params.status ?? "ALL"}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All statuses</option>
            {SHOOT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Filter
          </button>
        </form>

        {shoots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No shoots match.{" "}
            <Link href="/shoots/new" className="font-medium text-slate-900 underline">
              Create a shoot
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shoots.map((shoot) => (
              <ShootCard
                key={shoot.id}
                id={shoot.id}
                name={shoot.name}
                brandNames={shoot.brands.map((sb) => sb.brand.name)}
                startDate={shoot.startDate}
                endDate={shoot.endDate}
                status={shoot.status}
                image={shoot.image}
                expenseCount={shoot._count.expenses}
                totalAmount={totalByShoot.get(shoot.id) ?? 0}
                budget={shoot.budget}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
