import Link from "next/link";
import { AppShell } from "@/components/AppShell";
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
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter">
        <div className="page-header">
          <div>
            <h1 className="page-title">Shoots</h1>
            <p className="page-lead">Open a shoot to manage its expenses.</p>
          </div>
          <Link href="/shoots/new" className="btn btn-primary">
            New shoot
          </Link>
        </div>

        <form method="get" className="filter-bar !grid-cols-1 sm:!grid-cols-[1fr_auto_auto]">
          <div>
            <label className="field-label" htmlFor="shoots-q">
              Search
            </label>
            <input
              id="shoots-q"
              name="q"
              defaultValue={q}
              placeholder="Name, notes, or brand…"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="shoots-status">
              Status
            </label>
            <select
              id="shoots-status"
              name="status"
              defaultValue={params.status ?? "ALL"}
              className="field-input"
            >
              <option value="ALL">All statuses</option>
              {SHOOT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Filter
            </button>
          </div>
        </form>

        {shoots.length === 0 ? (
          <div className="panel-dashed p-8 text-center text-sm text-[var(--ink-muted)]">
            No shoots match.{" "}
            <Link href="/shoots/new" className="font-medium text-[var(--accent-ink)] underline">
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
    </AppShell>
  );
}
