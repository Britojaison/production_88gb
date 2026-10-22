/**
 * Import production expenses from:
 * public/88GB Production Expenses - Master_Payment_Approvals_Full.csv
 *
 * Run via: npm run db:import
 * Or as part of: npm run db:seed / db:setup
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { EXPENSE_CATEGORIES } from "../src/lib/categories";
import { SEED_BRANDS } from "../src/lib/brands";
import { randomShootImage } from "../src/lib/shoot-images";

const prisma = new PrismaClient();

export const CSV_REL =
  "public/88GB Production Expenses - Master_Payment_Approvals_Full.csv";

const CANONICAL_CATS = new Set(EXPENSE_CATEGORIES.map((c) => c.name.toLowerCase()));

/** Normalize brand aliases to seed names when possible. */
const BRAND_ALIASES: Record<string, string> = {
  "mm wear": "MM wear",
  mmwear: "MM wear",
  "mm wearment": "MM wear",
  "mmwearment": "MM wear",
  "milky mist": "MilkymistD",
  milkymistd: "MilkymistD",
  mmd: "MilkymistD",
  "super saravana stores": "Super Saravana Stores",
  sss: "Super Saravana Stores",
  "saravana stores jewelary": "Super Saravana Stores",
  "saravana stores jewlery": "Super Saravana Stores",
  "saravana stores jewelry": "Super Saravana Stores",
  "saravana stores pride": "Super Saravana Stores",
  "saravana stores pride and mmd": "MULTI", // handled specially
  cinco: "Cinco",
  sathya: "Sathya",
  "sathya stores": "Sathya",
  "sathya retailer": "Sathya",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "category";
}

function parseAmount(raw: string): number | null {
  const s = raw.replace(/[",\s₹]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // "15/11/2025 &" or "31/12/2025 & 08/12/2026" → first date
  const first = s.split(/[&,]/)[0]?.trim() ?? s;
  for (const fmt of [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ]) {
    const m = first.match(fmt);
    if (m) {
      const d = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const y = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo, d));
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  // Month name only → 1st of that month, year 2025 (sheet era)
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const key = first.toLowerCase();
  if (key in months) {
    return new Date(Date.UTC(2025, months[key]!, 1));
  }

  const iso = Date.parse(first);
  if (!Number.isNaN(iso)) return new Date(iso);
  return null;
}

function splitBrandTokens(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  const lower = s.toLowerCase();
  if (
    lower === "to be filled" ||
    lower === "no data" ||
    lower === "n/a" ||
    lower === "-"
  ) {
    return [];
  }

  // Split on commas, &, and, /
  const parts = s
    .split(/\s*(?:,|&|\/|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const part of parts) {
    const alias = BRAND_ALIASES[part.toLowerCase()];
    if (alias === "MULTI") continue;
    if (alias) {
      out.push(alias);
      continue;
    }
    // "MMD and SSS" style already split; leftover cleanups
    const cleaned = part.replace(/\s+/g, " ").trim();
    if (cleaned) out.push(cleaned);
  }
  return [...new Set(out)];
}

type CsvRow = {
  line: number;
  dateOfWork: string;
  brandRaw: string;
  campaign: string;
  payee: string;
  category: string;
  invoiceValue: string;
  advance: string;
  balance: string;
  dueDate: string;
  priority: string;
  paymentStatus: string;
  invoiceLink: string;
  paymentDate: string;
  account: string;
  remarks: string;
};

async function readCsv(filePath: string): Promise<CsvRow[]> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const rows: CsvRow[] = [];
  let headers: string[] | null = null;
  let line = 0;

  for await (const rawLine of rl) {
    line += 1;
    const cells = parseCsvLine(rawLine.replace(/^\uFEFF/, ""));
    if (!headers) {
      headers = cells.map((h) => h.trim());
      continue;
    }
    if (cells.every((c) => !c.trim())) continue;
    const get = (name: string) => {
      const i = headers!.findIndex((h) => h === name);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    rows.push({
      line,
      dateOfWork: get("Date of Work"),
      brandRaw: get("Client / Brand Name"),
      campaign: get("Campaign / Shoot Topic"),
      payee: get("Vendor / Payee Name"),
      category: get("Category"),
      invoiceValue: get("Invoice Value"),
      advance: get("Advance Payment"),
      balance: get("Balance Payment"),
      dueDate: get("Due Date"),
      priority: get("Priority Level"),
      paymentStatus: get("Payment Status"),
      invoiceLink: get("Invoice Link"),
      paymentDate: get("Payment Date"),
      account: get("Account"),
      remarks: get("Remarks - Proaegis"),
    });
  }
  return rows;
}

/** Minimal CSV line parser for quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export type ImportStats = {
  file: string;
  rowsRead: number;
  expensesCreated: number;
  shootsCreated: number;
  brandsCreated: number;
  brandsTotal: number;
  vendorsCreated: number;
  categoriesExtra: string[];
  skipped: Array<{ line: number; reason: string }>;
  assumptions: string[];
};

export async function importMasterCsv(opts?: {
  keepUsers?: boolean;
}): Promise<ImportStats> {
  const file = path.join(process.cwd(), CSV_REL);
  const csvRows = await readCsv(file);

  const skipped: ImportStats["skipped"] = [];
  const assumptions = [
    "Campaign / Shoot Topic → Shoot name (empty → \"Unassigned\").",
    "Client / Brand Name → Brand(s); split on comma/&/and; aliases map Milky Mist/MMD→MilkymistD, SSS→Super Saravana Stores, MM Wearment→MM wear.",
    "Vendor / Payee Name → Expense title + paidTo + Vendor directory.",
    "Invoice Value → amount (commas stripped).",
    "Payment Status Done → APPROVED + paid=true; Not Done → APPROVED + paid=false (work accepted, settlement pending).",
    "Payment Date → paidAt when present and status Done.",
    "Account + Invoice Link + Remarks → vendorPaymentDetails.",
    "Date of Work: first date if multi; month names → 1st of month 2025 UTC.",
    "Demo sample shoots/expenses replaced; login users preserved when keepUsers.",
  ];

  // Wipe operational data; optionally keep users
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shootBrand.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shoot.deleteMany();

  let teamId: string;
  if (opts?.keepUsers) {
    const team = await prisma.user.findUnique({
      where: { email: "team@88gb.local" },
    });
    const mgmt = await prisma.user.findUnique({
      where: { email: "mgmt@88gb.local" },
    });
    if (!team || !mgmt) {
      const passwordHash = await hash("password123", 10);
      const t =
        team ??
        (await prisma.user.create({
          data: {
            email: "team@88gb.local",
            name: "Video Team Member",
            passwordHash,
            role: "VIDEO_TEAM",
          },
        }));
      if (!mgmt) {
        await prisma.user.create({
          data: {
            email: "mgmt@88gb.local",
            name: "Production Manager",
            passwordHash,
            role: "MANAGEMENT",
          },
        });
      }
      teamId = t.id;
    } else {
      teamId = team.id;
    }
  } else {
    await prisma.user.deleteMany();
    const passwordHash = await hash("password123", 10);
    const team = await prisma.user.create({
      data: {
        email: "team@88gb.local",
        name: "Video Team Member",
        passwordHash,
        role: "VIDEO_TEAM",
      },
    });
    await prisma.user.create({
      data: {
        email: "mgmt@88gb.local",
        name: "Production Manager",
        passwordHash,
        role: "MANAGEMENT",
      },
    });
    teamId = team.id;
  }

  // Categories: canonical seven + any extras from CSV
  const extraCats = new Set<string>();
  for (const r of csvRows) {
    const c = r.category.trim();
    if (c && !CANONICAL_CATS.has(c.toLowerCase())) {
      // case-insensitive match to canonical
      const canon = EXPENSE_CATEGORIES.find(
        (x) => x.name.toLowerCase() === c.toLowerCase(),
      );
      if (!canon) extraCats.add(c);
    }
  }

  await prisma.category.createMany({
    data: [
      ...EXPENSE_CATEGORIES.map((c, index) => ({
        name: c.name,
        slug: c.slug,
        sortOrder: index,
      })),
      ...[...extraCats].map((name, i) => ({
        name,
        slug: slugify(name),
        sortOrder: EXPENSE_CATEGORIES.length + i,
      })),
    ],
  });
  const categories = await prisma.category.findMany();
  const catByLower = Object.fromEntries(
    categories.map((c) => [c.name.toLowerCase(), c]),
  );

  // Seed brands first so aliases resolve to exact names
  await prisma.brand.createMany({
    data: SEED_BRANDS.map((name) => ({ name })),
  });

  type NormRow = {
    line: number;
    shootName: string;
    brands: string[];
    payee: string;
    categoryId: string;
    amount: number;
    date: Date;
    paid: boolean;
    paidAt: Date | null;
    status: string;
    paymentDetails: string;
    title: string;
    notesBits: string[];
  };

  const normalized: NormRow[] = [];

  for (const r of csvRows) {
    const amount = parseAmount(r.invoiceValue);
    if (amount == null || amount <= 0) {
      skipped.push({ line: r.line, reason: "missing/invalid Invoice Value" });
      continue;
    }
    const payee = r.payee.trim();
    if (!payee) {
      skipped.push({ line: r.line, reason: "missing Vendor / Payee Name" });
      continue;
    }
    let date = parseDate(r.dateOfWork);
    if (!date) {
      skipped.push({
        line: r.line,
        reason: `unparseable Date of Work (${r.dateOfWork || "empty"})`,
      });
      continue;
    }

    const catKey = r.category.trim().toLowerCase();
    const category = catByLower[catKey];
    if (!category) {
      skipped.push({
        line: r.line,
        reason: `unknown category (${r.category || "empty"})`,
      });
      continue;
    }

    const shootName = r.campaign.trim() || "Unassigned";
    const brands = splitBrandTokens(r.brandRaw);
    const statusRaw = r.paymentStatus.trim().toLowerCase();
    const paid = statusRaw === "done";
    let paidAt: Date | null = null;
    if (paid) {
      paidAt = parseDate(r.paymentDate) ?? date;
    }

    const detailParts = [
      r.account ? `Account: ${r.account}` : "",
      r.invoiceLink ? `Invoice: ${r.invoiceLink}` : "",
      r.remarks ? `Remarks: ${r.remarks}` : "",
      r.advance ? `Advance: ${r.advance}` : "",
      r.balance ? `Balance: ${r.balance}` : "",
      r.dueDate ? `Due: ${r.dueDate}` : "",
      r.priority ? `Priority: ${r.priority}` : "",
    ].filter(Boolean);

    normalized.push({
      line: r.line,
      shootName,
      brands,
      payee,
      categoryId: category.id,
      amount,
      date,
      paid,
      paidAt,
      status: "APPROVED",
      paymentDetails:
        detailParts.join("\n") || "Imported from master payment approvals CSV",
      title: `${payee} — ${category.name}`,
      notesBits: [],
    });
  }

  // Brands from data
  const brandNames = new Set<string>(SEED_BRANDS);
  for (const n of normalized) {
    for (const b of n.brands) brandNames.add(b);
  }
  const existingBrands = await prisma.brand.findMany();
  const existingLower = new Set(existingBrands.map((b) => b.name.toLowerCase()));
  let brandsCreated = 0;
  for (const name of brandNames) {
    if (!existingLower.has(name.toLowerCase())) {
      await prisma.brand.create({ data: { name } });
      brandsCreated++;
      existingLower.add(name.toLowerCase());
    }
  }
  const allBrands = await prisma.brand.findMany();
  const brandIdByLower = Object.fromEntries(
    allBrands.map((b) => [b.name.toLowerCase(), b.id]),
  );

  // Vendors
  const payees = [...new Set(normalized.map((n) => n.payee))];
  const vendorIdByName: Record<string, string> = {};
  for (const name of payees) {
    const sample = normalized.find((n) => n.payee === name)!;
    const v = await prisma.vendor.create({
      data: {
        name,
        paymentDetails: sample.paymentDetails.slice(0, 2000),
      },
    });
    vendorIdByName[name] = v.id;
  }

  // Group into shoots
  const byShoot = new Map<string, NormRow[]>();
  for (const n of normalized) {
    const list = byShoot.get(n.shootName) ?? [];
    list.push(n);
    byShoot.set(n.shootName, list);
  }

  let expensesCreated = 0;
  for (const [shootName, items] of byShoot) {
    const dates = items.map((i) => i.date.getTime());
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    const allPaid = items.every((i) => i.paid);
    const shoot = await prisma.shoot.create({
      data: {
        name: shootName,
        startDate,
        endDate: endDate.getTime() === startDate.getTime() ? null : endDate,
        notes: `Imported from master CSV (${items.length} expense line${items.length === 1 ? "" : "s"}).`,
        status: allPaid ? "WRAPPED" : "ACTIVE",
        image: randomShootImage(),
        budget: null,
      },
    });

    const brandIds = new Set<string>();
    for (const item of items) {
      for (const b of item.brands) {
        const id = brandIdByLower[b.toLowerCase()];
        if (id) brandIds.add(id);
      }
    }
    if (brandIds.size > 0) {
      await prisma.shootBrand.createMany({
        data: [...brandIds].map((brandId) => ({
          shootId: shoot.id,
          brandId,
        })),
      });
    }

    for (const item of items) {
      await prisma.expense.create({
        data: {
          shootId: shoot.id,
          title: item.title,
          date: item.date,
          amount: item.amount,
          paidTo: item.payee,
          vendorPaymentDetails: item.paymentDetails,
          categoryId: item.categoryId,
          vendorId: vendorIdByName[item.payee],
          status: item.status,
          paid: item.paid,
          paidAt: item.paidAt,
          submitterId: teamId,
          submittedAt: item.date,
          reviewedAt: item.date,
        },
      });
      expensesCreated++;
    }
  }

  return {
    file: CSV_REL,
    rowsRead: csvRows.length,
    expensesCreated,
    shootsCreated: byShoot.size,
    brandsCreated,
    brandsTotal: allBrands.length,
    vendorsCreated: payees.length,
    categoriesExtra: [...extraCats],
    skipped,
    assumptions,
  };
}

async function main() {
  const stats = await importMasterCsv({ keepUsers: true });
  console.log(JSON.stringify(stats, null, 2));
  console.log(
    `Imported ${stats.expensesCreated} expenses across ${stats.shootsCreated} shoots from ${stats.file}`,
  );
  if (stats.skipped.length) {
    console.log(`Skipped ${stats.skipped.length} rows:`);
    for (const s of stats.skipped.slice(0, 40)) {
      console.log(`  line ${s.line}: ${s.reason}`);
    }
    if (stats.skipped.length > 40) {
      console.log(`  … +${stats.skipped.length - 40} more`);
    }
  }
}

const isDirect =
  typeof process.argv[1] === "string" &&
  process.argv[1].includes("import-master-csv");

if (isDirect) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
