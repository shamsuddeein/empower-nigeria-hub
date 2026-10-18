import { useState, useEffect, useRef } from "react";
import { type AdminUser, logoutAdmin } from "@/lib/adminAuth";
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

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  // Close drawer when screen resizes to desktop (>= 1024px)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  // Handle mobile drawer open/close side effects: focus, scroll lock, Escape, and focus trap
  useEffect(() => {
    if (!mobileMenuOpen) return;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button initially
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMobileMenuOpen(false);
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            el.offsetParent !== null ||
            (typeof window !== "undefined" && !el.hidden && window.getComputedStyle(el).display !== "none")
        );

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      menuTriggerRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-sand/30 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-navy text-white sticky top-0 z-40 border-b border-navy-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              ref={menuTriggerRef}
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-drawer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>

            <a href="/admin" className="flex items-center gap-2">
              <Logo onNavy asLink={false} />
              <span className="font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[150px] sm:max-w-none">
                Staff Administration
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white/90 truncate max-w-[180px] lg:max-w-none">
                {user.email}
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                {user.role} (Verified Admin)
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex min-h-[40px] items-center px-3.5 py-1.5 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              View Public Site
            </a>

            <button
              type="button"
              onClick={handleSignOut}
              className="hidden sm:inline-flex min-h-[40px] items-center px-3.5 py-1.5 rounded-lg bg-white/10 text-xs font-semibold hover:bg-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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
          <nav
            role="tablist"
            aria-label="Management Modules"
            className="bg-surface rounded-xl border border-border p-3 space-y-1 shadow-xs sticky top-22"
          >
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Management Modules
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={currentTab === item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                  currentTab === item.id
                    ? "bg-navy text-white shadow-xs"
                    : "text-foreground hover:bg-sand text-muted-foreground hover:text-navy"
                } focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none`}
              >
                <span>{item.label}</span>
                {currentTab === item.id && (
                  <span className="w-2 h-2 rounded-full bg-action shrink-0 ml-2" aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer (Constrained height with independent scrollable area) */}
        {mobileMenuOpen && (
          <div
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMobileMenuOpen(false);
              }
            }}
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-150"
          >
            <div
              id="admin-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin Navigation Menu"
              className="w-80 max-w-[85vw] bg-surface h-full shadow-2xl flex flex-col border-r border-border"
            >
              {/* Drawer Reachable Sticky Header */}
              <div className="shrink-0 flex items-center justify-between p-4 border-b border-border bg-surface">
                <div className="flex items-center gap-2">
                  <Logo asLink={false} />
                  <span className="font-bold text-navy text-sm">Staff Modules</span>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-border flex items-center justify-center text-xs font-semibold text-navy hover:bg-sand transition-colors focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
                >
                  Close
                </button>
              </div>

              {/* Independently Scrollable Navigation List: Guaranteed reachable on any screen height */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5" role="tablist">
                <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Modules
                </p>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={currentTab === item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                      currentTab === item.id
                        ? "bg-navy text-white shadow-xs"
                        : "text-foreground hover:bg-sand text-muted-foreground hover:text-navy"
                    } focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none`}
                  >
                    <span>{item.label}</span>
                    {currentTab === item.id && (
                      <span className="w-2 h-2 rounded-full bg-action shrink-0 ml-2" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>

              {/* Drawer Sticky Footer with User Details & Sign Out */}
              <div className="shrink-0 p-4 border-t border-border bg-surface/50 space-y-3">
                <div className="p-3 rounded-lg bg-sand/50 text-xs">
                  <div className="font-semibold text-navy truncate">{user.email}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                    {user.role} (Verified Admin)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center justify-center rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors text-center px-2 focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
                  >
                    Public Site
                  </a>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="min-h-[44px] flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors px-2 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Container */}
        <main className="flex-1 min-w-0" role="tabpanel">
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
