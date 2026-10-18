import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";
import { useCompany } from "@/lib/data";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

/**
 * Floating Call or WhatsApp actions.
 * Only shown when genuine contact details are configured.
 * Hidden on /apply, /admin, while a menu/dialog is open, when calculators/forms (#calculator, #ev-calculator, #enquire)
 * are in view, or while inputs are focused, to prevent mobile control obstruction.
 */
export function ContactBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { wa, tel, hasRealPhone, hasRealWhatsApp } = useCompany();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInteractiveSectionVisible, setIsInteractiveSectionVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Hidden on /apply and /admin
  const isHiddenRoute = path.startsWith("/apply") || path.startsWith("/admin");

  // Detect open dialogs (mobile menu, application modal) or locked body scroll
  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkDialog = () => {
      const dialog = document.querySelector('[role="dialog"]');
      const bodyLocked = document.body.style.overflow === "hidden";
      setIsDialogOpen(Boolean(dialog || bodyLocked));
    };

    checkDialog();
    const observer = new MutationObserver(checkDialog);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  // Detect focused inputs so floating buttons never cover on-screen keyboards or active inputs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Detect when calculators or enquiry forms are visible in the viewport to avoid obstructing inputs/actions
  useEffect(() => {
    if (typeof document === "undefined") return;

    const targetIds = [
      "how-it-works",
      "calculator",
      "electric-vehicles",
      "ev-calculator",
      "enquire",
    ];

    const checkVisibility = () => {
      const windowHeight = window.innerHeight || 800;
      for (const id of targetIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < windowHeight - 50 && rect.bottom > 50) {
            setIsInteractiveSectionVisible(true);
            return true;
          }
        }
      }
      return false;
    };

    // Check immediate anchor / initial load
    if (checkVisibility()) {
      setIsInteractiveSectionVisible(true);
    }

    const elements = targetIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && elements.length > 0) {
      const visibilityMap = new Map<Element, boolean>();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibilityMap.set(entry.target, entry.isIntersecting);
          }
          const isAnyVisible = Array.from(visibilityMap.values()).some(Boolean);
          setIsInteractiveSectionVisible(isAnyVisible);
        },
        { threshold: [0, 0.05], rootMargin: "0px 0px -40px 0px" }
      );

      elements.forEach((el) => observer?.observe(el));
    }

    const handleScrollOrNav = () => {
      checkVisibility();
    };

    window.addEventListener("scroll", handleScrollOrNav, { passive: true });
    window.addEventListener("hashchange", handleScrollOrNav);
    window.addEventListener("popstate", handleScrollOrNav);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", handleScrollOrNav);
      window.removeEventListener("hashchange", handleScrollOrNav);
      window.removeEventListener("popstate", handleScrollOrNav);
    };
  }, [path]);

  // Only show when genuine contact details exist and on valid routes
  if (isHiddenRoute || (!hasRealPhone && !hasRealWhatsApp)) {
    return null;
  }

  // Hide while menu/dialog is open, interactive calculators/forms in view, or active typing
  if (isDialogOpen || isInteractiveSectionVisible || isInputFocused) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-30 flex flex-col sm:flex-row items-end gap-2.5 transition-all duration-200"
      aria-label="Quick contact options"
    >
      {hasRealPhone && (
        <a
          href={tel}
          className={cn(
            btn({ variant: "secondary" }),
            "shadow-lg hover:shadow-xl font-semibold gap-2 rounded-full px-4 py-2.5 h-12 bg-surface border-navy/20 text-navy hover:bg-accent"
          )}
          aria-label="Call Us"
        >
          <Phone className="size-4 shrink-0 text-navy" />
          <span>Call Us</span>
        </a>
      )}
      {hasRealWhatsApp && (
        <a
          href={wa()}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            btn({ variant: "primary" }),
            "shadow-lg hover:shadow-xl font-semibold gap-2 rounded-full px-4 py-2.5 h-12"
          )}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="size-4 shrink-0" />
          <span>WhatsApp</span>
        </a>
      )}
    </div>
  );
}

export function useHasContactBar() {
  return false;
}
