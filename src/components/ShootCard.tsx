import Image from "next/image";
import Link from "next/link";
import { ShootStatusBadge } from "@/components/StatusBadge";
import { brandMonogram } from "@/lib/brand-logos";
import { formatCurrency, formatDateRange } from "@/lib/format";
import type { ShootStatus } from "@/lib/types";

export type ShootCardBrand = {
  name: string;
  logoPath: string | null;
};

export function ShootCard({
  id,
  name,
  brands,
  startDate,
  endDate,
  status,
  expenseCount,
  totalAmount,
  budget,
}: {
  id: string;
  name: string;
  brands: ShootCardBrand[];
  startDate: Date;
  endDate: Date | null;
  status: string;
  expenseCount: number;
  totalAmount: number;
  budget: number | null;
}) {
  const remaining = budget != null ? budget - totalAmount : null;
  const shown = brands.slice(0, 4);
  const extra = brands.length - shown.length;

  return (
    <Link href={`/shoots/${id}`} prefetch={true} className="shoot-card group">
      <div className="shoot-card-logos">
        <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
          <ShootStatusBadge status={status as ShootStatus} />
        </div>
        {shown.length === 0 ? (
          <div className="shoot-card-logo-row" data-count="1">
            <div className="brand-mark-fallback" aria-hidden>
              —
            </div>
          </div>
        ) : (
          <div
            className="shoot-card-logo-row"
            data-count={String(shown.length + (extra > 0 ? 1 : 0))}
          >
            {shown.map((brand) =>
              brand.logoPath ? (
                <span
                  key={brand.name}
                  className="brand-logo-tile relative overflow-hidden"
                  title={brand.name}
                >
                  <span
                    className="brand-mark-fallback absolute inset-0 !w-full !max-w-full opacity-60"
                    aria-hidden
                  >
                    {brandMonogram(brand.name)}
                  </span>
                  <Image
                    src={brand.logoPath}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1280px) 40vw, 28vw"
                    className="brand-logo-img relative z-10 transition-opacity duration-200"
                    loading="lazy"
                    decoding="async"
                    unoptimized
                  />
                </span>
              ) : (
                <span
                  key={brand.name}
                  className="brand-mark-fallback"
                  title={brand.name}
                  aria-label={brand.name}
                >
                  {brandMonogram(brand.name)}
                </span>
              ),
            )}
            {extra > 0 ? (
              <span className="brand-mark-fallback" title={`${extra} more`}>
                +{extra}
              </span>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2.5 sm:p-4">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-[var(--ink)] sm:text-base">
            {name}
          </h2>
          {brands.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1 sm:mt-2">
              {brands.slice(0, 2).map((b) => (
                <span
                  key={b.name}
                  className="brand-chip max-w-[85px] truncate sm:max-w-none"
                >
                  {b.name}
                </span>
              ))}
              {brands.length > 2 ? (
                <span className="brand-chip">+{brands.length - 2}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="truncate text-[0.6875rem] text-[var(--ink-muted)] sm:text-xs">
          {formatDateRange(startDate, endDate)}
        </p>
        <div className="mt-auto space-y-1 border-t border-[var(--border)] pt-2 sm:space-y-1.5 sm:pt-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
            <span className="text-[0.6875rem] text-[var(--ink-faint)] sm:text-xs">
              {expenseCount === 1 ? "1 expense" : `${expenseCount} expenses`}
            </span>
            <span className="amount-lg text-[var(--ink)]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {budget != null ? (
            <div className="flex flex-col gap-0.5 text-[0.65rem] text-[var(--ink-muted)] sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 sm:text-xs">
              <span className="truncate">Budget {formatCurrency(budget)}</span>
              <span
                className={
                  remaining != null && remaining < 0
                    ? "amount font-semibold text-[var(--danger-ink)]"
                    : "amount font-semibold text-[var(--ok-ink)]"
                }
              >
                Left {formatCurrency(remaining ?? 0)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
