/**
 * Upload receipts stored on local disk (public/uploads) to Supabase Storage
 * and repoint the expense rows to "supabase:<key>". Local files are left in place.
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ optional SUPABASE_RECEIPTS_BUCKET).
 * Run: npm run receipts:migrate
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const bucket = process.env.SUPABASE_RECEIPTS_BUCKET || "receipts";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  const storage = createClient(url, key, { auth: { persistSession: false } }).storage;

  const { data: buckets } = await storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    const { error } = await storage.createBucket(bucket, { public: false });
    if (error) throw error;
    console.log(`Created private bucket "${bucket}".`);
  }

  const rows = await prisma.expense.findMany({
    where: { receiptPath: { startsWith: "uploads/" } },
    select: { id: true, receiptPath: true },
  });

  let moved = 0;
  for (const row of rows) {
    const rel = row.receiptPath!;
    const filename = path.basename(rel);
    let body: Buffer;
    try {
      body = await readFile(path.join(process.cwd(), "public", rel));
    } catch {
      console.warn(`Missing local file for expense ${row.id}: ${rel}`);
      continue;
    }
    const { error } = await storage.from(bucket).upload(filename, body, {
      contentType: MIME[path.extname(filename).toLowerCase()] ?? "application/octet-stream",
      upsert: true,
    });
    if (error) {
      console.warn(`Upload failed for ${rel}: ${error.message}`);
      continue;
    }
    await prisma.expense.update({
      where: { id: row.id },
      data: { receiptPath: `supabase:${filename}` },
    });
    moved++;
  }
  console.log(`Moved ${moved} of ${rows.length} local receipts to Supabase Storage.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
