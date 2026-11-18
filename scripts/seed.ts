/**
 * ⚠ Destructive: wipes all expense data and users in the database from .env,
 * then imports the master CSV and creates the two demo logins.
 * Run: npm run db:seed
 */
import { importMasterCsv } from "./import-master-csv";

async function main() {
  const stats = await importMasterCsv({ keepUsers: false });
  console.log("Seeded users: team@88gb.local / mgmt@88gb.local (password123)");
  console.log(
    `Imported ${stats.expensesCreated} expenses / ${stats.shootsCreated} shoots / ${stats.brandsTotal} brands from ${stats.file}`,
  );
  if (stats.skipped.length) {
    console.log(`Skipped ${stats.skipped.length} CSV rows (see npm run db:import for detail)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
