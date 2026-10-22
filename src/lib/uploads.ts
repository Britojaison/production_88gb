import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 8 * 1024 * 1024;

export function publicUploadUrl(relativePath: string) {
  return `/${relativePath.replace(/^\/+/, "")}`;
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

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext =
    path.extname(file.name).toLowerCase() ||
    (file.type === "application/pdf" ? ".pdf" : ".bin");
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"].includes(ext)
    ? ext
    : file.type === "application/pdf"
      ? ".pdf"
      : ".png";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${safeExt}`;
  const absolute = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  return {
    relativePath: `uploads/${filename}`,
    originalName: file.name.slice(0, 200),
  };
}

export async function deleteReceiptFile(relativePath: string | null | undefined) {
  if (!relativePath || !relativePath.startsWith("uploads/")) return;
  const absolute = path.join(process.cwd(), "public", relativePath);
  try {
    await unlink(absolute);
  } catch {
    // ignore missing file
  }
}
