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
    <Link
      href={`/shoots/${id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-semibold text-slate-900">
              {name}
            </h2>
            {brandNames.length > 0 ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                {brandNames.join(" · ")}
              </p>
            ) : null}
          </div>
          <ShootStatusBadge status={status as ShootStatus} />
        </div>
        <p className="text-sm text-slate-600">
          {formatDateRange(startDate, endDate)}
        </p>
        <div className="mt-auto space-y-1 text-xs text-slate-500">
          <div className="flex items-baseline justify-between gap-2">
            <span>
              {expenseCount === 1 ? "1 expense" : `${expenseCount} expenses`}
            </span>
            <span className="font-medium text-slate-800">
              Spent {formatCurrency(totalAmount)}
            </span>
          </div>
          {budget != null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span>Budget {formatCurrency(budget)}</span>
              <span
                className={
                  remaining != null && remaining < 0
                    ? "font-medium text-rose-700"
                    : "font-medium text-slate-700"
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
