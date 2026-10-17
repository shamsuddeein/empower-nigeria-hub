import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getCurrentAdmin, type AdminUser } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () => seo("Staff Administration | S.i and Billionaires Hub", "Protected staff administration portal."),
  component: AdminPage,
});

function AdminPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentAdmin().then((u) => {
      if (active && u) {
        setAdminUser(u);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!adminUser) {
    return <AdminLogin onSuccess={(user) => setAdminUser(user)} />;
  }

  return <AdminLayout user={adminUser} onLogout={() => setAdminUser(null)} />;
}
