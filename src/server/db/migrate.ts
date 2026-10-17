import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";
import path from "node:path";

export async function runMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle/migrations_turso");
  console.log(`[db:migrate] Running migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("[db:migrate] Migrations completed successfully.");
}

// Allow standalone execution via `node` / `tsx`
if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("[db:migrate] Error during migration:", err);
      process.exit(1);
    });
}
