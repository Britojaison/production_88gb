import Link from "next/link";
import type { Bar } from "@/lib/dashboard";
import { formatCompactINR } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";

/** Ranked horizontal bars, single hue, value labelled at the end of each row. */
export function BarList({ bars, empty = "No spend in this range." }: { bars: Bar[]; empty?: string }) {
  if (bars.length === 0) return <p className="dash-empty">{empty}</p>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);
  return (
    <ul className="bar-list">
      {bars.map((b) => {
        const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
        return (
          <li
            key={b.key}
            className="bar-row"
            data-tip={`${b.label}: ${formatCurrency(b.value)} · ${pct}% of total`}
          >
            <span className="bar-label" title={b.label}>
              {b.label}
            </span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(b.value / max) * 100}%` }} />
            </span>
            <span className="bar-value amount">{formatCompactINR(b.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Vertical month columns; peak and latest month are labelled, the rest on hover. */
export function MonthColumns({ bars }: { bars: Bar[] }) {
  if (bars.length === 0) return <p className="dash-empty">No spend in this range.</p>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const peakKey = bars.reduce((p, b) => (b.value > p.value ? b : p), bars[0]!).key;
  const lastKey = bars[bars.length - 1]!.key;
  return (
    <div className="month-chart" role="img" aria-label="Committed spend by month">
      <div className="month-cols">
        {bars.map((b) => (
          <div key={b.key} className="month-col" data-tip={`${b.label}: ${formatCurrency(b.value)}`}>
            <span className="month-value">
              {b.key === peakKey || b.key === lastKey ? formatCompactINR(b.value) : ""}
            </span>
            <span
              className="month-fill"
              style={{ height: `${b.value > 0 ? Math.max((b.value / max) * 100, 1.5) : 0}%` }}
            />
          </div>
        ))}
      </div>
      <div className="month-axis">
        {bars.map((b, i) => (
          <span key={b.key}>
            {bars.length <= 12 || i % 2 === 0 || b.key === lastKey ? b.label : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Committed spend by month</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.key}>
              <th>{b.label}</th>
              <td>{formatCurrency(b.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type BudgetRow = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  status: string;
};

/** Budget use per shoot. Over-budget rows switch to the danger colour *and* say so in text. */
export function BudgetBurn({ rows }: { rows: BudgetRow[] }) {
  if (rows.length === 0) {
    return <p className="dash-empty">No shoots have a budget set yet.</p>;
  }
  return (
    <ul className="budget-list">
      {rows.map((r) => {
        const ratio = r.budget > 0 ? r.spent / r.budget : 0;
        const over = r.spent > r.budget;
        return (
          <li key={r.id} className="budget-row">
            <div className="budget-head">
              <Link href={`/shoots/${r.id}`} className="budget-name">
                {r.name}
              </Link>
              <span className={over ? "budget-pct is-over" : "budget-pct"}>
                {over
                  ? `Over by ${formatCurrency(r.spent - r.budget)}`
                  : `${Math.round(ratio * 100)}% used`}
              </span>
            </div>
            <div
              className="meter"
              data-tip={`${formatCurrency(r.spent)} of ${formatCurrency(r.budget)}`}
            >
              <span
                className={over ? "meter-fill is-over" : "meter-fill"}
                style={{ width: `${Math.min(ratio, 1) * 100}%` }}
              />
            </div>
            <p className="budget-sub amount">
              {formatCurrency(r.spent)} / {formatCurrency(r.budget)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
