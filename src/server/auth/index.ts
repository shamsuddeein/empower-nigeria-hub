import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "../db/index";
import * as schema from "../db/schema";

const isProduction = process.env["NODE_ENV"] === "production";
const authSecret = process.env["BETTER_AUTH_SECRET"];

if (isProduction && !authSecret) {
  throw new Error(
    "Missing BETTER_AUTH_SECRET environment variable in production. Configure a strong 32+ character secret."
  );
}

const secret = authSecret || "si-and-billionaires-hub-dev-secret-32-chars-long";
const vercelUrl = process.env["VERCEL_PROJECT_PRODUCTION_URL"] || process.env["VERCEL_URL"];
const baseURL =
  process.env["BETTER_AUTH_URL"] ||
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  ...(vercelUrl ? [`https://${vercelUrl}`] : []),
  ...(process.env["VERCEL_URL"] ? [`https://${process.env["VERCEL_URL"]}`] : []),
];

const trustedOrigins = process.env["TRUSTED_ORIGINS"]
  ? [...process.env["TRUSTED_ORIGINS"].split(",").map((s) => s.trim()), ...defaultOrigins]
  : defaultOrigins;

export const auth = betterAuth({
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
  baseURL,
  trustedOrigins,
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
      // Disable public registration; only internal bootstrap script with secret header or authorized admins can provision staff
      if (ctx.path.startsWith("/sign-up")) {
        const isBootstrap = ctx.headers?.get("x-internal-bootstrap") === secret;
        if (!isBootstrap) {
          throw new APIError("FORBIDDEN", {
            message: "Public staff registration is disabled. Contact your administrator for staff provisioning.",
          });
        }
      }
    }),
  },
});
