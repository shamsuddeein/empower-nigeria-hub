import { useState } from "react";
import { type AdminUser, logoutAdmin } from "@/lib/adminAuth";
import { companyDefaults } from "@/config/company";
import { Logo } from "@/components/site/Logo";
import { AdminOverview } from "./AdminOverview";
import { AdminApplications } from "./AdminApplications";
import { AdminProducts } from "./AdminProducts";
import { AdminInstallmentPlans } from "./AdminInstallmentPlans";
import { AdminLand } from "./AdminLand";
import { AdminAgents } from "./AdminAgents";
import { AdminTraining } from "./AdminTraining";
import { AdminTestimonialsMedia } from "./AdminTestimonialsMedia";
import { AdminFaqs } from "./AdminFaqs";
import { AdminSettings } from "./AdminSettings";
import { AdminMessages } from "./AdminMessages";

interface AdminLayoutProps {
  user: AdminUser;
  onLogout: () => void;
}

export type AdminTab =
  | "overview"
  | "applications"
  | "products"
  | "installments"
  | "land"
  | "agents"
  | "training"
  | "testimonials"
  | "faqs"
  | "settings"
  | "messages";

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AdminTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "applications", label: "Applications" },
    { id: "products", label: "Products & Pricing" },
    { id: "installments", label: "Installment Terms" },
    { id: "land", label: "Land & Plots" },
    { id: "agents", label: "Agents & Network" },
    { id: "training", label: "Vocational Training" },
    { id: "testimonials", label: "Testimonials & Media" },
    { id: "faqs", label: "FAQs" },
    { id: "settings", label: "Company Settings" },
    { id: "messages", label: "Inquiries & Messages" },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logoutAdmin();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-sand/30 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-navy text-white sticky top-0 z-40 border-b border-navy-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden px-3 py-1.5 rounded-md border border-white/20 text-xs font-semibold hover:bg-white/10"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
            <a href="/admin" className="flex items-center gap-2">
              <Logo onNavy asLink={false} />
              <span className="font-extrabold text-base tracking-tight hidden sm:inline">
                Staff Administration
              </span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white/90">{user.email}</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                {user.role} (Verified Admin)
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md border border-white/20 text-xs font-semibold hover:bg-white/10"
            >
              View Public Site
            </a>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-semibold hover:bg-white/20 text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <nav className="bg-surface rounded-xl border border-border p-3 space-y-1 shadow-xs sticky top-22">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Management Modules
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  currentTab === item.id
                    ? "bg-navy text-white shadow-xs"
                    : "text-foreground hover:bg-sand text-muted-foreground hover:text-navy"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/50 flex">
            <div className="w-72 bg-surface h-full p-4 space-y-2 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <span className="font-bold text-navy text-sm">Navigation</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-1 rounded border border-border text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                        currentTab === item.id
                          ? "bg-navy text-white"
                          : "text-foreground hover:bg-sand"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 text-center rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Container */}
        <main className="flex-1 min-w-0">
          {currentTab === "overview" && <AdminOverview onNavigate={(t) => setCurrentTab(t as AdminTab)} />}
          {currentTab === "applications" && <AdminApplications />}
          {currentTab === "products" && <AdminProducts />}
          {currentTab === "installments" && <AdminInstallmentPlans />}
          {currentTab === "land" && <AdminLand />}
          {currentTab === "agents" && <AdminAgents />}
          {currentTab === "training" && <AdminTraining />}
          {currentTab === "testimonials" && <AdminTestimonialsMedia />}
          {currentTab === "faqs" && <AdminFaqs />}
          {currentTab === "settings" && <AdminSettings />}
          {currentTab === "messages" && <AdminMessages />}
        </main>
      </div>
    </div>
  );
}
