import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {}
}

const isProduction = process.env["NODE_ENV"] === "production";
const tursoUrl = process.env["TURSO_DATABASE_URL"];
const tursoAuthToken = process.env["TURSO_AUTH_TOKEN"];

if (isProduction && !tursoUrl) {
  throw new Error(
    "Missing TURSO_DATABASE_URL environment variable in production. Configure Turso credentials to start the application."
  );
}

const dbUrl = tursoUrl || (process.env["VITEST"] ? ":memory:" : "file:local.db");

export const client = createClient({
  url: dbUrl,
  ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
});

export const db = drizzle(client, { schema });
export { schema };
