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
    <Link href={`/shoots/${id}`} className="shoot-card group">
      <div className="shoot-card-logos">
        <div className="absolute right-3 top-3 z-10">
          <ShootStatusBadge status={status as ShootStatus} />
        </div>
        {shown.length === 0 ? (
          <div className="brand-mark-fallback" aria-hidden>
            —
          </div>
        ) : (
          <div className="shoot-card-logo-row">
            {shown.map((brand) =>
              brand.logoPath ? (
                <span key={brand.name} className="brand-logo-tile" title={brand.name}>
                  <Image
                    src={brand.logoPath}
                    alt={brand.name}
                    width={96}
                    height={96}
                    sizes="48px"
                    className="brand-logo-img"
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
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--ink)]">
            {name}
          </h2>
          {brands.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {brands.slice(0, 3).map((b) => (
                <span key={b.name} className="brand-chip truncate">
                  {b.name}
                </span>
              ))}
              {brands.length > 3 ? (
                <span className="brand-chip">+{brands.length - 3}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          {formatDateRange(startDate, endDate)}
        </p>
        <div className="mt-auto space-y-1.5 border-t border-[var(--border)] pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-[var(--ink-faint)]">
              {expenseCount === 1 ? "1 expense" : `${expenseCount} expenses`}
            </span>
            <span className="amount-lg text-[var(--ink)]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {budget != null ? (
            <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--ink-muted)]">
              <span>Budget {formatCurrency(budget)}</span>
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
