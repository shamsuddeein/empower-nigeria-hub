import { useState } from "react";
import { loginWithSupabase, type AdminUser } from "@/lib/adminAuth";
import { companyDefaults } from "@/config/company";
import { Logo } from "@/components/site/Logo";
import { Button, Input } from "@/components/site/ui";

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newFieldErrors.email = "Please enter your staff email address.";
    }
    if (!password) {
      newFieldErrors.password = "Please enter your password.";
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please provide both your staff email and password.");
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const result = await loginWithSupabase(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      onSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center">
          <Logo className="h-9 w-auto" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy">
          Staff Administration Portal
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {companyDefaults.name} — Protected Internal Access
        </p>
      </div>

      <div className="mt-8 w-full max-w-md mx-auto">
        <div className="bg-surface py-8 px-6 shadow-sm border border-border rounded-xl sm:px-10">
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            Authorized staff only. Access requires an authenticated account registered in the company administrator directory.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium leading-relaxed"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="staff-email"
              label="Staff Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const { email: _, ...rest } = prev;
                    return rest;
                  });
                }
                if (error) setError(null);
              }}
              placeholder="staff@example.com"
            />

            <Input
              id="staff-password"
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const { password: _, ...rest } = prev;
                    return rest;
                  });
                }
                if (error) setError(null);
              }}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              disabled={loading}
              variant="navy"
              size="md"
              className="w-full h-12 min-h-[48px] text-base font-semibold cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In to Admin Portal"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex justify-center">
            <a
              href="/"
              className="text-sm font-semibold text-navy hover:underline"
            >
              Return to Public Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
