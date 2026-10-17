import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";
import { useCompany } from "@/lib/data";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

/**
 * Floating Call or WhatsApp actions.
 * Only shown when genuine contact details are configured.
 * Hidden on /apply, /admin, while a menu/dialog is open, or when #enquire is visible.
 */
export function ContactBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { wa, tel, hasRealPhone, hasRealWhatsApp } = useCompany();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEnquiryVisible, setIsEnquiryVisible] = useState(false);

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

  // Detect when the enquiry form (#enquire) is visible in the viewport
  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.getElementById("enquire");
    if (!el) {
      setIsEnquiryVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsEnquiryVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [path]);

  // Only show when genuine contact details exist and on valid routes
  if (isHiddenRoute || (!hasRealPhone && !hasRealWhatsApp)) {
    return null;
  }

  // Hide while menu/dialog is open or enquiry form is in view
  if (isDialogOpen || isEnquiryVisible) {
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
