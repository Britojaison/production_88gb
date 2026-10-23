import Link from "next/link";
import { PaidBadge, StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseStatus, Role } from "@/lib/types";

export type RequestRow = {
  id: string;
  title: string;
  amount: number;
  status: string;
  paid: boolean;
  date: Date;
  shootId: string;
  shootName: string;
  href: string;
};

export function RequestStatusRail({
  role,
  counts,
  recent,
}: {
  role: Role;
  counts: {
    submitted: number;
    approved: number;
    rejected: number;
    paid: number;
    unpaidApproved: number;
  };
  recent: RequestRow[];
}) {
  const isMgmt = role === "MANAGEMENT";

  return (
    <aside className="request-rail panel panel-pad">
      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">
          Request status
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          {isMgmt
            ? "Review queue and recent settlements."
            : "Your expense requests and settlement."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="request-stat">
            <span className="request-stat-value text-[var(--warn-ink)]">
              {counts.submitted}
            </span>
            <span className="request-stat-label">
              {isMgmt ? "Pending" : "Submitted"}
            </span>
          </div>
          <div className="request-stat">
            <span className="request-stat-value text-[var(--ok-ink)]">
              {counts.approved}
            </span>
            <span className="request-stat-label">Approved</span>
          </div>
          <div className="request-stat">
            <span className="request-stat-value text-[var(--danger-ink)]">
              {counts.rejected}
            </span>
            <span className="request-stat-label">Rejected</span>
          </div>
          <div className="request-stat">
            <span className="request-stat-value text-[var(--accent-ink)]">
              {counts.paid}
            </span>
            <span className="request-stat-label">Paid</span>
          </div>
        </div>

        {counts.unpaidApproved > 0 ? (
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            <span className="font-medium text-[var(--ink)]">
              {counts.unpaidApproved}
            </span>{" "}
            approved, still unpaid
          </p>
        ) : null}
      </div>

      <div className="request-rail-scroll">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Recent
        </h3>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">No requests yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--border)]">
            {recent.map((row) => (
              <li key={row.id} className="py-2.5 first:pt-1">
                <Link
                  href={row.href}
                  className="block rounded-md outline-none hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        {row.title}
                      </p>
                      <p className="truncate text-xs text-[var(--ink-faint)]">
                        {row.shootName} · {formatDate(row.date)}
                      </p>
                    </div>
                    <span className="amount shrink-0 text-xs text-[var(--ink)]">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 px-1">
                    <StatusBadge status={row.status as ExpenseStatus} />
                    <PaidBadge paid={row.paid} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {isMgmt ? (
          <Link
            href="/management"
            className="mt-4 inline-flex text-xs font-medium text-[var(--accent-ink)] underline"
          >
            Open full review list
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
