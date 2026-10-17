import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./index";

export async function requireAdminSession(customHeaders?: Headers) {
  let headers = customHeaders;
  if (!headers) {
    try {
      const rawHeaders = getRequestHeaders();
      headers = new Headers(rawHeaders as unknown as HeadersInit);
    } catch {
      // Outside server function context / test environment without active request
    }
  }

  if (!headers) {
    throw new Error("Unauthorized: Staff authentication required");
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized: Staff authentication required");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Staff admin privileges required");
  }

  return session;
}
