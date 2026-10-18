import { authClient } from "@/lib/auth-client";

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: "admin";
}

/**
 * Checks the current Better Auth session and strictly verifies that the user
 * has the 'admin' role. Does not trust any client-stored identity.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const res: any = await authClient.getSession();

  if (res?.error) {
    const errorMsg =
      res.error?.message ||
      (typeof res.error === "string" ? res.error : "Session verification service error");
    throw new Error(errorMsg);
  }

  const user = res?.data?.user;

  if (!user || user.role !== "admin") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "admin",
  };
}

/**
 * Authenticates staff with email and password via Better Auth,
 * then enforces that the authenticated user possesses the 'admin' role.
 */
export async function loginWithStaffCredentials(
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  try {
    const res = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (res.error) {
      return { user: null, error: res.error.message || "Failed to sign in." };
    }

    // Verify session and role
    const sessionRes: any = await authClient.getSession();
    const user = sessionRes.data?.user as any;

    if (!user || user.role !== "admin") {
      await authClient.signOut().catch(() => {});
      return {
        user: null,
        error: "Access denied. Your account is not registered as an authorized staff administrator.",
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "admin",
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sign in.";
    return { user: null, error: msg };
  }
}

/**
 * Backwards compatibility alias
 */
export const loginWithSupabase = loginWithStaffCredentials;

/**
 * Logs out staff and invalidates the Better Auth session.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await authClient.signOut();
  } catch (err) {
    console.error("Sign out error:", err);
  }
}
