import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { auth } from "./index";

export async function bootstrapStaffUser({
  email,
  password,
  name = "Staff Administrator",
}: {
  email: string;
  password: string;
  name?: string;
}) {
  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error(`Invalid email address format: ${email}`);
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const existing = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, cleanEmail))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const existingUser = existing[0];
    if (existingUser.role !== "admin") {
      await db
        .update(schema.user)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(schema.user.id, existingUser.id));
      console.log(`[staff:bootstrap] Elevated existing user ${cleanEmail} to admin.`);
    } else {
      console.log(`[staff:bootstrap] User ${cleanEmail} is already an admin.`);
    }
    return { id: existingUser.id, email: cleanEmail, role: "admin" };
  }

  const secret = process.env["BETTER_AUTH_SECRET"] || "si-and-billionaires-hub-dev-secret-32-chars-long";
  const headers = new Headers();
  headers.set("x-internal-bootstrap", secret);

  const res = await auth.api.signUpEmail({
    body: {
      email: cleanEmail,
      password,
      name,
    },
    headers,
  });

  if (!res || !res.user) {
    throw new Error("Failed to create staff user through Better Auth API.");
  }

  // Elevate to admin role
  await db
    .update(schema.user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(schema.user.id, res.user.id));

  console.log(`[staff:bootstrap] Successfully provisioned admin user: ${cleanEmail}`);
  return { id: res.user.id, email: cleanEmail, role: "admin" };
}

// Standalone execution handler
async function main() {
  const args = process.argv.slice(2);
  let email = process.env["STAFF_EMAIL"];
  let password = process.env["STAFF_PASSWORD"];
  let name = process.env["STAFF_NAME"] || "Staff Administrator";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === "--email" && nextArg) {
      email = nextArg;
      i++;
    } else if (arg === "--password" && nextArg) {
      password = nextArg;
      i++;
    } else if (arg === "--name" && nextArg) {
      name = nextArg;
      i++;
    }
  }

  if (!email || !password) {
    console.error(
      "Usage: npm run staff:bootstrap -- --email <admin-email> --password <strong-password> [--name <name>]\n" +
      "Or set STAFF_EMAIL and STAFF_PASSWORD environment variables."
    );
    process.exit(1);
  }

  try {
    await bootstrapStaffUser({ email, password, name });
    process.exit(0);
  } catch (err) {
    console.error("[staff:bootstrap] Error:", err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("bootstrap.ts")) {
  main();
}
