import { PrismaClient } from "@prisma/client";
import { importMasterCsv } from "../scripts/import-master-csv";

const prisma = new PrismaClient();

async function main() {
  // Replaces demo shoots/expenses with production CSV; keeps/creates login users.
  const stats = await importMasterCsv({ keepUsers: false });
  console.log("Seeded users: team@88gb.local / mgmt@88gb.local (password123)");
  console.log(
    `Imported ${stats.expensesCreated} expenses / ${stats.shootsCreated} shoots / ${stats.brandsTotal} brands from ${stats.file}`,
  );
  if (stats.skipped.length) {
    console.log(`Skipped ${stats.skipped.length} CSV rows (see npm run db:import for detail)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
