import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getCurrentAdmin, type AdminUser } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () =>
    seo(
      "Staff Administration | S.i and Billionaires Hub",
      "Protected staff administration portal."
    ),
  component: AdminPage,
});

type AuthState = "checking" | "authenticated" | "signed_out" | "error";

function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkSession = () => {
    let active = true;
    setAuthState("checking");
    setAuthError(null);

    getCurrentAdmin()
      .then((user) => {
        if (!active) return;
        if (user) {
          setAdminUser(user);
          setAuthState("authenticated");
        } else {
          setAdminUser(null);
          setAuthState("signed_out");
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Session verification failure:", err);
        setAuthError(
          err instanceof Error ? err.message : "Unable to verify staff session."
        );
        setAuthState("error");
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return checkSession();
  }, []);

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-sand/30 flex items-center justify-center p-4">
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-surface p-8 max-w-sm w-full text-center space-y-3 shadow-xs"
        >
          <div className="mx-auto size-8 animate-spin rounded-full border-3 border-navy border-t-transparent" />
          <h2 className="text-sm font-bold text-navy">Checking staff credentials...</h2>
          <p className="text-xs text-muted-foreground">
            Verifying secure administrative session.
          </p>
        </div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="min-h-screen bg-sand/30 flex items-center justify-center p-4">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-surface p-8 max-w-md w-full text-center space-y-4 shadow-xs"
        >
          <div className="mx-auto size-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-lg">
            !
          </div>
          <div>
            <h2 className="text-base font-bold text-navy">Session verification error</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {authError ?? "Could not connect to the authentication server."}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={checkSession}
              className="min-h-[44px] px-4 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Retry Session Check
            </button>
            <button
              type="button"
              onClick={() => setAuthState("signed_out")}
              className="min-h-[44px] px-4 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
            >
              Staff Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authState === "signed_out" || !adminUser) {
    return (
      <AdminLogin
        onSuccess={(user) => {
          setAdminUser(user);
          setAuthState("authenticated");
        }}
      />
    );
  }

  return (
    <AdminLayout
      user={adminUser}
      onLogout={() => {
        setAdminUser(null);
        setAuthState("signed_out");
      }}
    />
  );
}
