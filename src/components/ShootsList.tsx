"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShootCard, type ShootCardBrand } from "@/components/ShootCard";
import { getMoreShootsAction } from "@/app/actions/shoots";
import type { Role } from "@/lib/types";

export type ShootItem = {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string | null;
  status: string;
  expenseCount: number;
  totalAmount: number;
  budget: number | null;
  brands: ShootCardBrand[];
};

export function ShootsList({
  initialShoots,
  totalCount,
  status,
  q,
  role,
}: {
  initialShoots: ShootItem[];
  totalCount: number;
  status?: string;
  q?: string;
  role: Role;
}) {
  const [shoots, setShoots] = useState<ShootItem[]>(initialShoots);
  const [isPending, startTransition] = useTransition();

  const hasMore = shoots.length < totalCount;

  function handleLoadMore() {
    startTransition(async () => {
      try {
        const res = await getMoreShootsAction({
          offset: shoots.length,
          limit: 6,
          status,
          q,
        });
        setShoots((prev) => [...prev, ...res.shoots]);
      } catch (err) {
        console.error("Failed to load more shoots:", err);
      }
    });
  }

  if (shoots.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
        {shoots.map((shoot) => (
          <ShootCard
            key={shoot.id}
            id={shoot.id}
            name={shoot.name}
            brands={shoot.brands}
            startDate={new Date(shoot.startDate)}
            endDate={shoot.endDate ? new Date(shoot.endDate) : null}
            status={shoot.status}
            expenseCount={shoot.expenseCount}
            totalAmount={shoot.totalAmount}
            budget={shoot.budget}
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-2 pt-2 pb-6 text-center">
        <p className="text-xs text-[var(--ink-muted)]">
          Showing {shoots.length} of {totalCount} shoots
        </p>
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="btn btn-secondary px-5 py-2 text-xs font-medium transition-all"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading shoots…
              </span>
            ) : (
              `Load more (${Math.min(6, totalCount - shoots.length)} more)`
            )}
          </button>
        ) : totalCount > 6 ? (
          <p className="text-xs text-[var(--ink-faint)]">
            All {totalCount} shoots loaded
          </p>
        ) : null}
      </div>
    </div>
  );
}

