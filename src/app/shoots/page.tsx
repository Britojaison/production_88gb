import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  RequestStatusRail,
  type RequestRow,
} from "@/components/RequestStatusRail";
import { ShootCard } from "@/components/ShootCard";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import type { Role } from "@/lib/types";
import { SHOOT_STATUSES } from "@/lib/types";

export const instant = false;

export default async function ShootsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user } = await requireDbUser();
  const role = user.role as Role;
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status && params.status !== "ALL" ? params.status : undefined;

  const requestWhere =
    role === "MANAGEMENT"
      ? {
          status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
        }
      : {
          submitterId: user.id,
          status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
        };

  const scopeBase =
    role === "MANAGEMENT" ? {} : { submitterId: user.id };

  const [shoots, totals, requestPool, submittedN, approvedN, rejectedN, paidN, unpaidApprovedN] =
    await Promise.all([
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
          brands: {
            include: { brand: true },
            orderBy: { brand: { name: "asc" } },
          },
        },
      }),
      prisma.expense.groupBy({
        by: ["shootId"],
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: requestWhere,
        include: { shoot: { select: { id: true, name: true } } },
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        take: 40,
      }),
      prisma.expense.count({
        where: { ...scopeBase, status: "SUBMITTED" },
      }),
      prisma.expense.count({
        where: { ...scopeBase, status: "APPROVED" },
      }),
      prisma.expense.count({
        where: { ...scopeBase, status: "REJECTED" },
      }),
      prisma.expense.count({
        where: { ...scopeBase, paid: true },
      }),
      prisma.expense.count({
        where: { ...scopeBase, status: "APPROVED", paid: false },
      }),
    ]);

  const totalByShoot = new Map(
    totals.map((row) => [row.shootId, row._sum.amount ?? 0]),
  );

  const counts = {
    submitted: submittedN,
    approved: approvedN,
    rejected: rejectedN,
    paid: paidN,
    unpaidApproved: unpaidApprovedN,
  };

  // Prefer pending for mgmt; otherwise most recent activity
  const recentSource =
    role === "MANAGEMENT"
      ? [
          ...requestPool.filter((e) => e.status === "SUBMITTED"),
          ...requestPool.filter((e) => e.status !== "SUBMITTED"),
        ]
      : requestPool;

  const recent: RequestRow[] = recentSource.slice(0, 8).map((e) => ({
    id: e.id,
    title: e.title,
    amount: e.amount,
    status: e.status,
    paid: e.paid,
    date: e.submittedAt ?? e.date,
    shootId: e.shoot.id,
    shootName: e.shoot.name,
    href:
      role === "MANAGEMENT"
        ? `/management/${e.id}`
        : `/shoots/${e.shootId}/expenses/${e.id}`,
  }));

  return (
    <AppShell name={user.name} role={role}>
      <main className="page-shell-wide page-enter">
        <div className="page-header">
          <div>
            <h1 className="page-title">Shoots</h1>
            <p className="page-lead">
              Open a shoot to manage its expenses. Request status stays on the
              right.
            </p>
          </div>
          {role === "VIDEO_TEAM" ? (
            <Link href="/shoots/new" className="btn btn-primary">
              New shoot
            </Link>
          ) : (
            <Link href="/management" className="btn btn-secondary">
              Reviews
            </Link>
          )}
        </div>

        <div className="shoots-layout">
          <div className="min-w-0">
            <form
              method="get"
              className="filter-bar !grid-cols-1 sm:!grid-cols-[1fr_auto_auto]"
            >
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
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Filter
                </button>
              </div>
            </form>

            {shoots.length === 0 ? (
              <div className="panel-dashed p-8 text-center text-sm text-[var(--ink-muted)]">
                No shoots match.{" "}
                {role === "VIDEO_TEAM" ? (
                  <>
                    <Link
                      href="/shoots/new"
                      className="font-medium text-[var(--accent-ink)] underline"
                    >
                      Create a shoot
                    </Link>
                    .
                  </>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>

          <RequestStatusRail role={role} counts={counts} recent={recent} />
        </div>
      </main>
    </AppShell>
  );
}
