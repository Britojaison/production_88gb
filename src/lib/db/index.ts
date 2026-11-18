/**
 * Server-only Supabase access (service-role key, bypasses RLS).
 * Never import this from a client component — the key must not reach the browser.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export type DB = SupabaseClient<Database>;
export type { Database, Insert, Row, Update } from "@/lib/db/types";

let client: DB | null = null;

export function db(): DB {
  if (typeof window !== "undefined") {
    throw new Error("db() is server-only");
  }
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Database not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        // Always hit the database — app-level caching lives in data-cache.ts
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
  }
  return client;
}

/**
 * Throw on a PostgREST error; return `data`.
 * For list/single/insert-select results (never null on success). For writes without
 * `.select()` the returned value is meaningless — just call it for the error check.
 */
export function must<D>(res: { data: D; error: { message: string } | null }, what = "query"): NonNullable<D> {
  if (res.error) throw new Error(`[db] ${what} failed: ${res.error.message}`);
  return res.data as NonNullable<D>;
}

/** Like `must`, for `.maybeSingle()` where "not found" (null) is a valid answer. */
export function maybe<D>(res: { data: D; error: { message: string } | null }, what = "query"): D {
  if (res.error) throw new Error(`[db] ${what} failed: ${res.error.message}`);
  return res.data;
}

/* ---------------- dates ---------------- */

/** Columns stored as `timestamp without time zone` holding UTC wall time. */
const DATE_KEYS = new Set([
  "date",
  "dueDate",
  "paidAt",
  "submittedAt",
  "reviewedAt",
  "createdAt",
  "updatedAt",
  "startDate",
  "endDate",
]);
type DateKey =
  | "date"
  | "dueDate"
  | "paidAt"
  | "submittedAt"
  | "reviewedAt"
  | "createdAt"
  | "updatedAt"
  | "startDate"
  | "endDate";

/** Row type with timestamp strings turned into Date (recursively through embeds). */
export type Revived<V> = V extends Array<infer U>
  ? Revived<U>[]
  : V extends Date
    ? V
    : V extends object
      ? { [K in keyof V]: K extends DateKey ? (null extends V[K] ? Date | null : Date) : Revived<V[K]> }
      : V;

/** Parse a DB timestamp (no zone suffix ⇒ UTC). */
export function toDate(v: string): Date;
export function toDate(v: string | null): Date | null;
export function toDate(v: string | null): Date | null {
  if (v == null) return null;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`);
}

/** Date → string for writing (UTC wall time). */
export function toDb(d: Date): string;
export function toDb(d: Date | null): string | null;
export function toDb(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function revive<V>(value: V): Revived<V> {
  if (Array.isArray(value)) return value.map(revive) as Revived<V>;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] =
        DATE_KEYS.has(k) && (typeof v === "string" || v === null)
          ? toDate(v as string | null)
          : revive(v);
    }
    return out as Revived<V>;
  }
  return value as Revived<V>;
}

/* ---------------- helpers ---------------- */

const PAGE = 1000; // PostgREST max rows per request

/** Fetch every row of a query in pages of 1000 (PostgREST caps responses). */
export async function fetchAll<R>(
  page: (from: number, to: number) => PromiseLike<{ data: R[] | null; error: { message: string } | null }>,
  what = "query",
): Promise<R[]> {
  const all: R[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await page(from, from + PAGE - 1);
    const rows = must(res, what) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) return all;
  }
}

/** Make free text safe inside a PostgREST `or=(…)` / ilike pattern. */
export function likePattern(q: string) {
  const cleaned = q.replace(/[,()*%_\\"]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? `%${cleaned}%` : null;
}
