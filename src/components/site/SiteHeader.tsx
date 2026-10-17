import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCompany } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { primaryNav, secondaryNav } from "./nav";
import { btn } from "./ui";

function pageTopic(path: string) {
  const hit = primaryNav.find((n) => path.startsWith(n.to));
  return hit ? hit.label : "your products and payment plans";
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { wa, tel } = useCompany();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const navLink = "rounded-md px-2.5 py-2 text-[0.9375rem] font-medium text-foreground hover:bg-accent hover:text-navy";
  const active = "text-navy font-semibold underline decoration-action decoration-2 underline-offset-8";

  return (
    <header className={cn("sticky top-0 z-40 bg-background transition-[border-color]", scrolled ? "border-b" : "border-b border-transparent")}>
      <div className="hidden border-b bg-surface lg:block">
        <div className="container-site flex h-9 items-center justify-end gap-5 text-sm">
          {secondaryNav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-navy" activeProps={{ className: "text-navy font-semibold" }}>
              {n.label}
            </Link>
          ))}
          <a href={tel} className="font-semibold text-navy">Call us</a>
        </div>
      </div>
      <div className="container-site flex h-16 items-center justify-between gap-3 lg:h-[72px]">
        <Logo />
        <nav aria-label="Main" className="hidden min-w-0 items-center xl:flex">
          {primaryNav.map((n) => (
            <Link key={n.to} to={n.to} className={navLink} activeProps={{ className: active }}>
              {n.label === "Financial Services and Training" ? "Finance and Training" : n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <a href={wa(pageTopic(path))} target="_blank" rel="noopener noreferrer" className={cn(btn({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            WhatsApp
          </a>
          <Link to="/apply" className={cn(btn({ size: "sm" }), "h-10 px-4")}>
            Apply Now
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-12 items-center justify-center rounded-md text-navy hover:bg-accent xl:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu">
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-background xl:hidden">
          <div className="container-site flex h-16 shrink-0 items-center justify-between border-b">
            <Logo />
            <button type="button" autoFocus onClick={() => setOpen(false)} className="inline-flex size-12 items-center justify-center rounded-md text-navy hover:bg-accent" aria-label="Close menu">
              <X className="size-6" />
            </button>
          </div>
          <div className="container-site flex-1 overflow-y-auto py-4">
            <Link to="/apply" className={cn(btn({ size: "lg" }), "w-full")}>Apply Now</Link>
            <nav aria-label="Mobile" className="mt-4">
              <ul className="divide-y border-y">
                {primaryNav.map((n) => (
                  <li key={n.to}>
                    <Link to={n.to} className="flex min-h-14 items-center text-lg font-semibold text-navy" activeProps={{ className: "text-action" }}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 grid grid-cols-2 gap-x-4">
                {secondaryNav.map((n) => (
                  <li key={n.to}>
                    <Link to={n.to} className="flex min-h-12 items-center text-base text-foreground">{n.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="container-site grid shrink-0 grid-cols-2 gap-3 border-t py-4">
            <a href={tel} className={btn({ variant: "secondary" })}><Phone className="size-5" aria-hidden />Call</a>
            <a href={wa(pageTopic(path))} target="_blank" rel="noopener noreferrer" className={btn({ variant: "navy" })}><MessageCircle className="size-5" aria-hidden />WhatsApp</a>
          </div>
        </div>
      )}
    </header>
  );
}
