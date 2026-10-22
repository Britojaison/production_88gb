import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { SEED_BRANDS } from "../src/lib/brands";
import { EXPENSE_CATEGORIES } from "../src/lib/categories";
import { randomShootImage } from "../src/lib/shoot-images";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", 10);

  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shootBrand.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shoot.deleteMany();
  await prisma.user.deleteMany();

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

  await prisma.category.createMany({
    data: EXPENSE_CATEGORIES.map((c, index) => ({
      name: c.name,
      slug: c.slug,
      sortOrder: index,
    })),
  });
  const categories = await prisma.category.findMany();
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  await prisma.brand.createMany({
    data: SEED_BRANDS.map((name) => ({ name })),
  });
  const brands = await prisma.brand.findMany();
  const brandByName = Object.fromEntries(brands.map((b) => [b.name, b]));

  const frameHire = await prisma.vendor.create({
    data: {
      name: "FrameHire Rentals",
      paymentDetails: "UPI framehire@oksbi / Inv FH-1042",
    },
  });
  const cafe = await prisma.vendor.create({
    data: {
      name: "Cafe On Set",
      paymentDetails: "Cash / UPI cafeonset@okaxis",
    },
  });

  const brandFilm = await prisma.shoot.create({
    data: {
      name: "Brand Film — Q4 Campaign",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-12"),
      notes: "Studio + outdoor B-roll in Mumbai.",
      status: "ACTIVE",
      image: randomShootImage(),
      budget: 50000,
    },
  });

  const productLaunch = await prisma.shoot.create({
    data: {
      name: "Product Launch Event",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-01"),
      notes: "Single-day coverage at venue.",
      status: "PLANNED",
      image: randomShootImage(),
      budget: 25000,
    },
  });

  const documentary = await prisma.shoot.create({
    data: {
      name: "Documentary B-roll Day",
      startDate: new Date("2026-09-20"),
      endDate: new Date("2026-09-21"),
      notes: "City exteriors and interviews.",
      status: "WRAPPED",
      image: randomShootImage(),
      budget: 15000,
    },
  });

  // Multi-brand on Brand Film; others get one each
  await prisma.shootBrand.createMany({
    data: [
      { shootId: brandFilm.id, brandId: brandByName["MM wear"].id },
      { shootId: brandFilm.id, brandId: brandByName.Cinco.id },
      { shootId: productLaunch.id, brandId: brandByName["Super Saravana Stores"].id },
      { shootId: documentary.id, brandId: brandByName.MilkymistD.id },
      { shootId: documentary.id, brandId: brandByName.Sathya.id },
    ],
  });

  const submitted = await prisma.expense.create({
    data: {
      shootId: brandFilm.id,
      title: "Camera kit rental",
      date: new Date("2026-10-10"),
      amount: 18500,
      paidTo: frameHire.name,
      vendorPaymentDetails: frameHire.paymentDetails,
      vendorId: frameHire.id,
      categoryId: bySlug["camera-rental"].id,
      status: "SUBMITTED",
      submitterId: team.id,
      submittedAt: new Date("2026-10-11"),
    },
  });

  await prisma.expense.create({
    data: {
      shootId: brandFilm.id,
      title: "Craft services — day 1",
      date: new Date("2026-10-10"),
      amount: 4200,
      paidTo: cafe.name,
      vendorPaymentDetails: cafe.paymentDetails,
      vendorId: cafe.id,
      categoryId: bySlug.studio.id,
      status: "DRAFT",
      submitterId: team.id,
    },
  });

  await prisma.expense.create({
    data: {
      shootId: productLaunch.id,
      title: "Gaffer overtime",
      date: new Date("2026-11-01"),
      amount: 3000,
      paidTo: "Ravi K.",
      vendorPaymentDetails: "Bank transfer pending approval",
      categoryId: bySlug.freelancer.id,
      status: "DRAFT",
      submitterId: team.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      expenseId: submitted.id,
      actorId: team.id,
      action: "SUBMITTED",
      fromStatus: "DRAFT",
      toStatus: "SUBMITTED",
      note: "Seeded submission",
    },
  });

  console.log("Seeded users: team@88gb.local / mgmt@88gb.local (password123)");
  console.log("Seeded brands:", SEED_BRANDS.join(", "));
  console.log(
    "Seeded categories:",
    EXPENSE_CATEGORIES.map((c) => c.name).join(", "),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
