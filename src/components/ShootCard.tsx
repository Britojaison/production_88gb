import Image from "next/image";
import Link from "next/link";
import { ShootStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { shootImageSrc } from "@/lib/shoot-images";
import type { ShootStatus } from "@/lib/types";

export function ShootCard({
  id,
  name,
  brandNames,
  startDate,
  endDate,
  status,
  image,
  expenseCount,
  totalAmount,
  budget,
}: {
  id: string;
  name: string;
  brandNames: string[];
  startDate: Date;
  endDate: Date | null;
  status: string;
  image: string | null;
  expenseCount: number;
  totalAmount: number;
  budget: number | null;
}) {
  const src = shootImageSrc(image, id);
  const remaining = budget != null ? budget - totalAmount : null;

  return (
    <Link href={`/shoots/${id}`} className="shoot-card group">
      <div className="shoot-card-image">
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute right-2 top-2 z-10">
          <ShootStatusBadge status={status as ShootStatus} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-tight text-[var(--ink)]">
            {name}
          </h2>
          {brandNames.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {brandNames.slice(0, 3).map((b) => (
                <span key={b} className="brand-chip truncate">
                  {b}
                </span>
              ))}
              {brandNames.length > 3 ? (
                <span className="brand-chip">+{brandNames.length - 3}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          {formatDateRange(startDate, endDate)}
        </p>
        <div className="mt-auto space-y-1 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--ink-muted)]">
          <div className="flex items-baseline justify-between gap-2">
            <span>
              {expenseCount === 1 ? "1 expense" : `${expenseCount} expenses`}
            </span>
            <span className="amount font-medium text-[var(--ink)]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {budget != null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span>Budget {formatCurrency(budget)}</span>
              <span
                className={
                  remaining != null && remaining < 0
                    ? "amount font-medium text-[var(--danger-ink)]"
                    : "amount font-medium text-[var(--ink)]"
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
