import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCompany } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { landingNav } from "./nav";
import { btn } from "./ui";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { wa, tel, hasRealPhone, hasRealWhatsApp } = useCompany();

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousOverflowRef = useRef<string>("");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [path]);

  // Close and reset menu state when crossing the desktop breakpoint (>= 1024px)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setOpen(false);
      }
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const handleClose = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      menuTriggerRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!open) return;
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey) {
          if (document.activeElement === first || !modal.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modal.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflowRef.current;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (path === "/" && href.startsWith("#")) {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
      handleClose();
    } else {
      handleClose();
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-background transition-[border-color,background-color]",
          scrolled
            ? "border-b border-border bg-background/95 backdrop-blur-sm"
            : "border-b border-transparent",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-3 lg:h-[72px]">
          <Logo />

          <nav aria-label="Main navigation" className="hidden min-w-0 items-center gap-1 lg:flex">
            {landingNav.map((n) => (
              <a
                key={n.href}
                href={path === "/" ? n.href : `/${n.href}`}
                onClick={(e) => scrollToSection(e, n.href)}
                className="rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-accent hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {hasRealWhatsApp ? (
              <a
                href={wa()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  btn({ variant: "ghost", size: "sm" }),
                  "hidden xl:inline-flex text-navy font-semibold",
                )}
              >
                Chat on WhatsApp
              </a>
            ) : (
              <a
                href={path === "/" ? "#enquire" : "/#enquire"}
                onClick={(e) => scrollToSection(e, "#enquire")}
                className={cn(
                  btn({ variant: "ghost", size: "sm" }),
                  "hidden xl:inline-flex text-navy font-semibold",
                )}
              >
                Contact Us
              </a>
            )}

            <a
              href={path === "/" ? "#enquire" : "/#enquire"}
              onClick={(e) => scrollToSection(e, "#enquire")}
              className={cn(btn({ variant: "primary", size: "sm" }), "font-semibold")}
            >
              Apply Now
            </a>

            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-input bg-surface px-3.5 text-sm font-semibold text-navy hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {typeof document !== "undefined" &&
        open &&
        createPortal(
          <div
            ref={modalRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground lg:hidden"
          >
            <div className="container-site flex h-16 shrink-0 items-center justify-between border-b border-border bg-background">
              <Logo />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-input bg-surface px-3.5 text-sm font-semibold text-navy hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </div>

            <div className="container-site flex-1 min-h-0 overflow-y-auto py-6">
              <a
                href={path === "/" ? "#enquire" : "/#enquire"}
                onClick={(e) => scrollToSection(e, "#enquire")}
                className={cn(btn({ variant: "primary", size: "lg" }), "w-full font-semibold")}
              >
                Apply Now
              </a>

              <nav aria-label="Mobile navigation" className="mt-6">
                <ul className="divide-y border-y border-border">
                  {landingNav.map((n) => (
                    <li key={n.href}>
                      <a
                        href={path === "/" ? n.href : `/${n.href}`}
                        onClick={(e) => scrollToSection(e, n.href)}
                        className="flex min-h-[48px] items-center text-lg font-semibold text-navy hover:text-action"
                      >
                        {n.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="container-site shrink-0 border-t border-border bg-background py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-3">
                {hasRealPhone ? (
                  <a href={tel} className={cn(btn({ variant: "secondary" }), "font-semibold")}>
                    Call Us
                  </a>
                ) : (
                  <a
                    href={path === "/" ? "#enquire" : "/#enquire"}
                    onClick={(e) => scrollToSection(e, "#enquire")}
                    className={cn(btn({ variant: "secondary" }), "font-semibold")}
                  >
                    Submit Enquiry
                  </a>
                )}
                {hasRealWhatsApp ? (
                  <a
                    href={wa()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(btn({ variant: "navy" }), "font-semibold")}
                  >
                    Chat on WhatsApp
                  </a>
                ) : (
                  <a
                    href={path === "/" ? "#enquire" : "/#enquire"}
                    onClick={(e) => scrollToSection(e, "#enquire")}
                    className={cn(btn({ variant: "navy" }), "font-semibold")}
                  >
                    Enquire Online
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
