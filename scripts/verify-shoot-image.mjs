import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const image = `/images/${1 + Math.floor(Math.random() * 11)}.png`;

async function main() {
  const shoot = await prisma.shoot.create({
    data: {
      name: `Verify image ${Date.now()}`,
      startDate: new Date(),
      status: "PLANNED",
      image,
    },
  });
  console.log("OK created shoot with image:", shoot.id, shoot.image);
  await prisma.shoot.delete({ where: { id: shoot.id } });
  console.log("VERIFY PASS");
}

main()
  .catch((e) => {
    console.error("VERIFY FAIL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
