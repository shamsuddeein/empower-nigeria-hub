import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import * as schema from "../src/server/db/schema";

async function main() {
  console.log("=== Verifying Better Auth Handler Against Disposable SQLite DB ===");

  // 1. Create in-memory disposable db
  const client = createClient({ url: "file::memory:?cache=shared" });
  const db = drizzle(client, { schema });

  // 2. Initialize schema tables in disposable memory db
  await client.execute(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      banned INTEGER,
      ban_reason TEXT,
      ban_expires INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE TABLE session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      impersonated_by TEXT
    );
  `);
  await client.execute(`
    CREATE TABLE account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE TABLE verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  console.log("[PASS] Disposable in-memory SQLite schema provisioned successfully.");

  // 3. Initialize Better Auth instance
  const secret = "disposable-test-secret-at-least-32-chars-long";
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret,
    baseURL: "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: false,
    },
    plugins: [
      admin({
        defaultRole: "staff",
        adminRole: "admin",
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path.startsWith("/sign-up")) {
          const isBootstrap = ctx.headers?.get("x-internal-bootstrap") === secret;
          if (!isBootstrap) {
            throw new APIError("FORBIDDEN", {
              message: "Public staff registration is disabled.",
            });
          }
        }
      }),
    },
  });

  // 4. Test public sign-up without bootstrap header (should be rejected by middleware with 403)
  const reqUnauthorizedSignUp = new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@example.com",
      password: "Password123!",
      name: "Attacker",
    }),
  });
  const resUnauthorized = await auth.handler(reqUnauthorizedSignUp);
  console.log("[Check] Public sign-up status:", resUnauthorized.status);
  if (resUnauthorized.status !== 403) {
    throw new Error(`Expected 403 Forbidden for public sign-up, got ${resUnauthorized.status}`);
  }
  console.log("[PASS] Public registration properly forbidden (403).");

  // 5. Test staff provision with bootstrap header (validates Zod 4 email and password schemas)
  const reqBootstrapSignUp = new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-bootstrap": secret,
    },
    body: JSON.stringify({
      email: "admin@sib-hub.ng",
      password: "StrongAdminPassword123!",
      name: "Verified Administrator",
    }),
  });
  const resBootstrap = await auth.handler(reqBootstrapSignUp);
  console.log("[Check] Bootstrap sign-up status:", resBootstrap.status);
  const bootstrapBody = await resBootstrap.json();
  if (resBootstrap.status !== 200 || !bootstrapBody.user?.email) {
    throw new Error(`Bootstrap registration failed: ${JSON.stringify(bootstrapBody)}`);
  }
  console.log("[PASS] Staff user created successfully through Better Auth handler:", bootstrapBody.user.email);

  // 6. Test invalid email schema rejection via Zod 4
  const reqInvalidEmail = new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      password: "anypassword",
    }),
  });
  const resInvalid = await auth.handler(reqInvalidEmail);
  console.log("[Check] Invalid email rejection status:", resInvalid.status);
  if (resInvalid.status !== 400) {
    throw new Error(`Expected 400 for invalid email, got ${resInvalid.status}`);
  }
  console.log("[PASS] Zod validation properly rejected invalid email format (400).");

  // 7. Test legitimate sign-in with valid credentials
  const reqSignIn = new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@sib-hub.ng",
      password: "StrongAdminPassword123!",
    }),
  });
  const resSignIn = await auth.handler(reqSignIn);
  console.log("[Check] Sign-in status:", resSignIn.status);
  const signInBody = await resSignIn.json();
  if (resSignIn.status !== 200 || !signInBody.user) {
    throw new Error(`Sign-in failed: ${JSON.stringify(signInBody)}`);
  }
  console.log("[PASS] Sign-in succeeded with authenticated session token:", Boolean(signInBody.token));

  // 8. Clean up client
  client.close();
  console.log("=== ALL BETTER AUTH HANDLER DISPOSABLE DB CHECKS PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
