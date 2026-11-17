import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  RequestStatusRail,
  type RequestRow,
} from "@/components/RequestStatusRail";
import { ShootsList } from "@/components/ShootsList";
import { ShootsResponsiveLayout } from "@/components/ShootsResponsiveLayout";
import {
  getCachedExpenseCounts,
  getCachedRecentRequests,
  getCachedShoots,
} from "@/lib/data-cache";
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

  const scopeBase =
    role === "MANAGEMENT" ? {} : { submitterId: user.id };

  const [shootsData, requestPool, counts] = await Promise.all([
    getCachedShoots({ status, q, limit: 6, offset: 0 }),
    getCachedRecentRequests(role, scopeBase.submitterId),
    getCachedExpenseCounts(scopeBase.submitterId),
  ]);

  const initialShoots = shootsData.shoots;

  // Prefer pending for mgmt; otherwise most recent activity
  const recentSource =
    role === "MANAGEMENT"
      ? [
          ...requestPool.filter((e) => e.status === "SUBMITTED"),
          ...requestPool.filter((e) => e.status !== "SUBMITTED"),
        ]
      : requestPool;

  const recent: RequestRow[] = recentSource.slice(0, 40).map((e) => ({
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
      <main className="page-shell-wide page-enter shoots-page">
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

        <ShootsResponsiveLayout
          shootsCount={shootsData.totalCount}
          pendingCount={counts.submitted}
          shootsContent={
            <>
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

              <ShootsList
                initialShoots={initialShoots}
                totalCount={shootsData.totalCount}
                status={status}
                q={q}
                role={role}
              />
            </>
          }
          railContent={
            <RequestStatusRail role={role} counts={counts} recent={recent} />
          }
        />
      </main>
    </AppShell>
  );
}
