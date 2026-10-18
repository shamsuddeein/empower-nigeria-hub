import { useEffect, useRef, type ReactNode } from "react";

interface AdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  subtitle?: string | undefined;
  children: ReactNode;
  maxWidth?: string | undefined;
}

export function AdminDialog({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
}: AdminDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const wasOpenRef = useRef(false);

  const effectiveDescription = description ?? subtitle;

  // Manage opening transition: scroll lock, save trigger element, set initial focus once
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return undefined;
    }

    if (wasOpenRef.current) {
      return undefined;
    }

    wasOpenRef.current = true;
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first interactive field (input/select/textarea) or dialog container.
    // Do NOT focus Close button so typing into fields is completely uninterrupted.
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const firstField = dialogRef.current.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        if (firstField) {
          firstField.focus();
        } else {
          const focusables = Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
          if (focusables[0]) {
            focusables[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }
    }, 40);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard navigation: Escape key to dismiss, Tab & Shift+Tab focus trap
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCloseRef.current();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby={effectiveDescription ? "admin-dialog-description" : undefined}
        tabIndex={-1}
        className={`w-full ${maxWidth} max-h-[calc(100dvh-2rem)] flex flex-col bg-surface rounded-xl border border-border shadow-2xl overflow-hidden focus:outline-none`}
      >
        {/* Sticky Accessible Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-border bg-surface">
          <div>
            <h2 id="admin-dialog-title" className="text-lg font-bold text-navy tracking-tight">
              {title}
            </h2>
            {effectiveDescription && (
              <p id="admin-dialog-description" className="mt-0.5 text-xs text-muted-foreground">
                {effectiveDescription}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-lg flex items-center justify-center text-muted-foreground hover:text-navy hover:bg-sand/60 transition-colors focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
          >
            <span className="text-xl font-bold leading-none">&times;</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
