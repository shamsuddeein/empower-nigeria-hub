import { useState, useEffect, useRef } from "react";
import { useMarkups, useCompany } from "@/lib/data";
import { calculatePlan, type Frequency } from "@/lib/installments";
import { naira } from "@/lib/format";
import { btn } from "./ui";
import { cn } from "@/lib/utils";
import { ProductImagePlaceholder } from "./DevelopmentPlaceholders";

export type ProductDetailItem = {
  id?: string | null;
  name: string;
  category: string;
  brand?: string | null;
  cash_price: number;
  description?: string | null;
  specs?: Record<string, string | number> | null;
  in_stock?: boolean;
  images?: string[] | null;
  isAssessment?: boolean;
};

export function ProductDetailPanel({
  product,
  onClose,
  onApply,
}: {
  product: ProductDetailItem | null;
  onClose: () => void;
  onApply: (product: ProductDetailItem, duration: number, frequency: Frequency) => void;
}) {
  const markups = useMarkups();
  const { wa, hasRealWhatsApp } = useCompany();
  const [duration, setDuration] = useState<number>(6);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!product) return;

    returnFocusRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [product, onClose]);

  if (!product) return null;

  const plan = calculatePlan({
    price: product.cash_price,
    months: duration,
    frequency,
    markups,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overscroll-contain"
    >
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        className="relative z-10 flex flex-col w-full max-w-xl max-h-[min(92dvh,calc(100dvh-1.5rem))] rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
      >
        {/* Fixed Header: Always visible */}
        <div className="shrink-0 flex items-start justify-between border-b border-border bg-surface px-5 py-3.5 sm:px-6 sm:py-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-action">
              {product.isAssessment
                ? `COMMERCIAL ASSESSMENT • ${product.category.toUpperCase()}`
                : product.brand
                  ? `${product.brand} • ${product.category.toUpperCase()}`
                  : product.category.toUpperCase()}
            </span>
            <h2 id="product-detail-title" className="mt-0.5 text-xl font-bold text-navy sm:text-2xl">
              {product.name}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-input bg-surface px-3.5 py-1.5 text-sm font-semibold text-navy hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close product specifications"
          >
            Close
          </button>
        </div>

        {/* Scrollable Body: Always reachable on mobile & landscape screens */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="aspect-[16/10] w-full rounded-lg object-cover border border-border"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <ProductImagePlaceholder
              category={product.category}
              productName={product.name}
            />
          )}

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>
          )}

          {/* Pricing & Confirmed Plan Options */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">
                {product.isAssessment ? "Indicative Budget Estimate" : "Outright Cash Price"}
              </span>
              <span className="text-xl font-bold text-navy">{naira(product.cash_price)}</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-navy">Select Tenor</span>
                <div className="mt-1.5 flex gap-1.5">
                  {[3, 6, 9, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-lg border text-xs font-semibold",
                        duration === m
                          ? "border-navy bg-navy text-navy-foreground"
                          : "border-input bg-surface text-foreground hover:bg-accent"
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-navy">Cadence</span>
                <div className="mt-1.5 flex gap-1.5">
                  {(["weekly", "monthly"] as Frequency[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-lg border text-xs font-semibold capitalize",
                        frequency === f
                          ? "border-navy bg-navy text-navy-foreground"
                          : "border-input bg-surface text-foreground hover:bg-accent"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-navy p-4 text-navy-foreground">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-navy-muted">
                  {frequency === "weekly" ? "Weekly" : "Monthly"} Installment
                </span>
                <span className="text-2xl font-bold">{naira(plan.perPayment)}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-navy-muted">
                <span>{plan.payments} total installments</span>
                <span>Total repayable: {naira(plan.total)}</span>
              </div>
            </div>
          </div>

          {/* Technical Scope / Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                {product.isAssessment ? "Indicative System Scope" : "Technical Specifications"}
              </h3>
              <dl className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between px-4 py-2.5">
                    <dt className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                    <dd className="font-medium text-navy">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Practical Notice */}
          <div className="rounded-lg bg-accent/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
            <strong>Northern Nigeria Availability:</strong> Hardware is supplied and inspected
            directly through our Kaduna headquarters and authorized regional partner shops.
            {product.isAssessment
              ? " System capacity and final configuration are established following physical site evaluation."
              : " Installment terms require in-person trade and premise verification prior to final approval."}
          </div>
        </div>

        {/* Fixed Footer: Always visible and clickable */}
        <div className="shrink-0 flex flex-wrap gap-3 border-t border-border bg-surface px-5 py-3.5 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => onApply(product, duration, frequency)}
            className={cn(btn({ variant: "primary", size: "md" }), "flex-1 font-semibold")}
          >
            {product.isAssessment ? "Apply for Assessment" : "Apply for This Item"}
          </button>
          <a
            href={
              hasRealWhatsApp
                ? wa(`Hello, I would like to enquire about ${product.name} (₦${product.cash_price.toLocaleString()}).`)
                : "#enquire"
            }
            target={hasRealWhatsApp ? "_blank" : undefined}
            rel={hasRealWhatsApp ? "noopener noreferrer" : undefined}
            className={cn(btn({ variant: "secondary", size: "md" }), "font-semibold text-navy")}
          >
            {hasRealWhatsApp ? "Chat on WhatsApp" : "Send Enquiry"}
          </a>
        </div>
      </div>
    </div>
  );
}
