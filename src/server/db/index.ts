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

const isTest = Boolean(process.env["VITEST"]);
const dbUrl = isTest ? ":memory:" : (tursoUrl || "file:local.db");

// Use @libsql/client/web for remote Turso connections (HTTP/HTTPS/libsql) to avoid native C/C++ cross-platform binary dependencies on Vercel.
// For local testing (:memory:) or local file development, fall back to @libsql/client.
let createLibsqlClient: typeof import("@libsql/client/web").createClient;

if (!isTest && (tursoUrl || dbUrl.startsWith("libsql:") || dbUrl.startsWith("https:") || dbUrl.startsWith("http:"))) {
  const webClientModule = await import("@libsql/client/web");
  createLibsqlClient = webClientModule.createClient;
} else {
  const nodeMod = "@libsql/client";
  const nodeClientModule = await import(/* @vite-ignore */ nodeMod);
  createLibsqlClient = nodeClientModule.createClient;
}

export const client = createLibsqlClient({
  url: dbUrl,
  ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
});

export const db = drizzle(client, { schema });
export { schema };
