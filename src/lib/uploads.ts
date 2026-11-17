import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Receipt storage.
 * - Supabase Storage (private bucket) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
 *   Stored as "supabase:<object-key>".
 * - Local disk under public/uploads otherwise (dev only). Stored as "uploads/<file>".
 * Receipts are always served through /api/receipts/[expenseId], which checks access.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const SUPABASE_PREFIX = "supabase:";
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 8 * 1024 * 1024;

export const RECEIPTS_BUCKET = process.env.SUPABASE_RECEIPTS_BUCKET || "receipts";

let client: SupabaseClient | null = null;

export function supabaseStorageEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function storage() {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client.storage.from(RECEIPTS_BUCKET);
}

/** Link used in the UI for an expense's receipt. */
export function receiptHref(expenseId: string) {
  return `/api/receipts/${expenseId}`;
}

function safeExtension(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"].includes(ext)) return ext;
  return file.type === "application/pdf" ? ".pdf" : ".png";
}

export async function saveReceiptFile(file: File): Promise<{
  relativePath: string;
  originalName: string;
}> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Receipt must be an image (JPEG/PNG/WebP/GIF) or PDF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Receipt must be 8MB or smaller");
  }

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${safeExtension(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name.slice(0, 200);

  if (supabaseStorageEnabled()) {
    const { error } = await storage().upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(`Receipt upload failed: ${error.message}`);
    return { relativePath: `${SUPABASE_PREFIX}${filename}`, originalName };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Receipt storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { relativePath: `uploads/${filename}`, originalName };
}

export async function deleteReceiptFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  if (relativePath.startsWith(SUPABASE_PREFIX)) {
    if (!supabaseStorageEnabled()) return;
    await storage().remove([relativePath.slice(SUPABASE_PREFIX.length)]);
    return;
  }
  if (!relativePath.startsWith("uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", relativePath));
  } catch {
    // ignore missing file
  }
}

/** Resolve a stored receipt to a URL the browser can open (short-lived when private). */
export async function resolveReceiptUrl(relativePath: string): Promise<string | null> {
  if (relativePath.startsWith(SUPABASE_PREFIX)) {
    if (!supabaseStorageEnabled()) return null;
    const { data, error } = await storage().createSignedUrl(
      relativePath.slice(SUPABASE_PREFIX.length),
      60,
    );
    return error ? null : data.signedUrl;
  }
  if (relativePath.startsWith("uploads/")) return `/${relativePath}`;
  return null;
}
