import { useState, useEffect, useRef, useId } from "react";
import { useCompany, useMarkups } from "@/lib/data";
import { calculatePlan, type Frequency } from "@/lib/installments";
import { normalizeNgPhone, NORTHERN_STATES } from "@/lib/validation";
import { naira } from "@/lib/format";
import { btn } from "./ui";
import { cn } from "@/lib/utils";
import { submitApplicationFn } from "@/server/functions/publicSubmissions";

export type ApplicationInitialData = {
  productId?: string;
  productName?: string;
  category: string;
  price?: number;
  duration?: number;
  frequency?: Frequency;
  deposit?: number;
  upfrontCharges?: number;
};

export function ApplicationModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ApplicationInitialData | null;
}) {
  const { wa, hasRealWhatsApp } = useCompany();
  const markups = useMarkups();
  const id = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Persistent submission idempotency key for this application session
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Synchronized form and offer states
  const [productName, setProductName] = useState(
    initialData?.productName ?? "Commercial Solar System"
  );
  const [category, setCategory] = useState(initialData?.category ?? "solar");
  const [price, setPrice] = useState<number>(initialData?.price ?? 850000);
  const [duration, setDuration] = useState<number>(initialData?.duration ?? 6);
  const [frequency, setFrequency] = useState<Frequency>(
    initialData?.frequency ?? "weekly"
  );
  const [deposit, setDeposit] = useState<number>(initialData?.deposit ?? 0);

  // Applicant details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [stateName, setStateName] = useState("Kaduna");
  const [lga, setLga] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  // Re-synchronize offer details whenever the modal is opened or initialData changes
  useEffect(() => {
    if (isOpen) {
      setProductName(initialData?.productName ?? "Commercial Solar System");
      setCategory(initialData?.category ?? "solar");
      setPrice(initialData?.price ?? 850000);
      setDuration(initialData?.duration ?? 6);
      setFrequency(initialData?.frequency ?? "weekly");
      // Preserve chosen deposit from calculator or product options!
      setDeposit(initialData?.deposit ?? 0);
      setSuccessReference(null);
      setError(null);
      setSubmitting(false);
      // Generate unique idempotency key for this submission attempt
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [isOpen, initialData]);

  // Focus management, Escape key trapping, background scroll isolation, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const plan = calculatePlan({
    price,
    months: duration,
    frequency,
    deposit,
    markups,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Client-side validation
    const cleanPhone = normalizeNgPhone(phone);
    if (!cleanPhone) {
      setError("Please enter a valid 11-digit Nigerian phone number (e.g. 08031234567).");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (address.trim().length < 3) {
      setError("Please enter your business or shop street address.");
      return;
    }

    if (occupation.trim().length < 2) {
      setError("Please enter your business type or trade.");
      return;
    }

    const cleanWa = whatsapp ? normalizeNgPhone(whatsapp) : undefined;

    setSubmitting(true);
    try {
      const res = await submitApplicationFn({
        data: {
          idempotencyKey,
          category,
          productId: initialData?.productId || null,
          productName: productName.trim(),
          expectedPrice: price,
          price,
          duration,
          frequency,
          deposit,
          fullName: fullName.trim(),
          phone: cleanPhone,
          whatsapp: cleanWa,
          email: email.trim() || undefined,
          state: stateName,
          lga: lga.trim() || "Central",
          address: address.trim(),
          occupation: occupation.trim(),
        },
      });

      if (!res.success) {
        if ("termsChanged" in res && res.termsChanged) {
          if ("currentPrice" in res && typeof res.currentPrice === "number") {
            setPrice(res.currentPrice);
          }
          setError(
            ("message" in res && typeof res.message === "string" ? res.message : undefined) ||
              "The product price has changed on our system. Please review the updated repayment schedule."
          );
        } else {
          setError(
            ("message" in res && typeof res.message === "string" ? res.message : undefined) ||
              "Could not record your application at this time. Your details have been retained — please try again."
          );
        }
        return;
      }

      // Confirmed stored on server - validate returned application reference
      if ("reference" in res && typeof res.reference === "string" && res.reference.trim()) {
        setSuccessReference(res.reference.trim());
      } else {
        throw new Error("Application was submitted but no valid reference was returned by the server.");
      }
    } catch (err: unknown) {
      console.error("Unexpected application error:", err);
      const msg = err instanceof Error ? err.message : "Network error submitting application.";
      setError(`${msg} Your entered details have been retained. Please try submitting again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overscroll-contain"
    >
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        className="relative z-10 flex flex-col w-full max-w-2xl max-h-[min(92dvh,calc(100dvh-1.5rem))] rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
      >
        {/* Fixed Header: Always visible across all screen sizes */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3.5 sm:px-6 sm:py-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-action">
              Official Installment Application
            </span>
            <h2 id={`${id}-title`} className="mt-0.5 text-lg font-bold text-navy sm:text-xl">
              {successReference ? "Application Received" : "Apply for Payment Plan"}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-input bg-surface px-3.5 py-1.5 text-sm font-semibold text-navy hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close application dialog"
          >
            Close
          </button>
        </div>

        {/* Scrollable Modal Content: Fully accessible on short screens & mobile keyboards */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">

        {successReference ? (
          <div className="py-6">
            <div className="rounded-lg border border-action bg-action-soft p-6">
              <span className="text-xs font-semibold text-action uppercase tracking-wider">
                Application Reference Code
              </span>
              <p className="mt-1 font-display text-3xl font-extrabold text-navy">
                {successReference}
              </p>
              <p className="mt-3 text-sm text-foreground">
                Thank you, <strong className="text-navy">{fullName}</strong>. Your
                application for <strong className="text-navy">{productName}</strong> has
                been recorded and is awaiting staff verification.
              </p>
              <div className="mt-4 rounded-md border border-border bg-surface p-4 text-sm">
                <span className="block font-semibold text-navy">
                  Proposed Plan Summary (Subject to Formal Verification):
                </span>
                <p className="text-muted-foreground mt-1">
                  {plan.hasDifferentFinalPayment ? (
                    <>
                      {plan.payments - 1} payments of {naira(plan.perPayment)} + 1 final payment of {naira(plan.finalPayment)} ({frequency}).
                    </>
                  ) : (
                    <>
                      {naira(plan.perPayment)} every {frequency === "weekly" ? "week" : "month"}{" "}
                      for {duration} months ({plan.payments} payments total).
                    </>
                  )}
                </p>
                {deposit > 0 && (
                  <p className="text-xs text-navy font-medium mt-1">
                    Upfront Deposit: {naira(deposit)} &bull; Total Repayable: {naira(plan.total)}
                  </p>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Our verification officer in Kaduna will review your business premises
                details and contact you on <strong className="text-navy">{phone}</strong>{" "}
                within one working day to inspect equipment readiness and finalize written terms.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {hasRealWhatsApp ? (
                <a
                  href={wa(
                    `Hello, I submitted an application with reference ${successReference} for ${productName}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(btn({ variant: "navy" }), "flex-1 font-semibold")}
                >
                  Send Reference on WhatsApp
                </a>
              ) : (
                <a
                  href="#enquire"
                  onClick={onClose}
                  className={cn(btn({ variant: "navy" }), "flex-1 font-semibold")}
                >
                  Contact Verification Team
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className={cn(btn({ variant: "secondary" }), "font-semibold text-navy")}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive"
              >
                {error}
              </div>
            )}

            {/* Plan Calculation Review */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-sm">
                <span className="font-semibold text-navy">{productName}</span>
                <span className="text-muted-foreground">Cash Value: {naira(price)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Tenor</span>
                  <p className="font-bold text-navy">{duration} Months</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency</span>
                  <p className="font-bold text-navy capitalize">{frequency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Regular Payment</span>
                  <p className="font-display font-extrabold text-action">
                    {naira(plan.perPayment)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Payable</span>
                  <p className="font-bold text-navy">{naira(plan.total)}</p>
                </div>
              </div>
              {deposit > 0 && (
                <div className="mt-3 border-t border-border pt-2 text-xs text-navy font-medium flex justify-between">
                  <span>Upfront Deposit Applied:</span>
                  <span>{naira(deposit)}</span>
                </div>
              )}
              {plan.hasDifferentFinalPayment && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Note: Final reconciled installment is {naira(plan.finalPayment)} ({plan.payments} payments total).
                </div>
              )}
            </div>

            {/* Applicant Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`${id}-name`} className="block text-sm font-semibold text-navy">
                  Full Name *
                </label>
                <input
                  id={`${id}-name`}
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sani Abubakar"
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${id}-phone`} className="block text-sm font-semibold text-navy">
                  Phone Number *
                </label>
                <input
                  id={`${id}-phone`}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`${id}-whatsapp`} className="block text-sm font-semibold text-navy">
                  WhatsApp Number (Optional)
                </label>
                <input
                  id={`${id}-whatsapp`}
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Leave empty if same as phone"
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${id}-email`} className="block text-sm font-semibold text-navy">
                  Email Address (Optional)
                </label>
                <input
                  id={`${id}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sani@example.com"
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`${id}-state`} className="block text-sm font-semibold text-navy">
                  State *
                </label>
                <select
                  id={`${id}-state`}
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {NORTHERN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="Other">Other State</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${id}-lga`} className="block text-sm font-semibold text-navy">
                  LGA or Town *
                </label>
                <input
                  id={`${id}-lga`}
                  type="text"
                  required
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  placeholder="e.g. Kaduna North, Zaria"
                  className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${id}-addr`} className="block text-sm font-semibold text-navy">
                Shop / Business Physical Address *
              </label>
              <input
                id={`${id}-addr`}
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 14, Ahmadu Bello Way, Central Market"
                className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${id}-occ`} className="block text-sm font-semibold text-navy">
                Business Trade or Trade Type *
              </label>
              <input
                id={`${id}-occ`}
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Provisions Merchant, Phone Accessories, Tailoring"
                className="h-12 min-h-[48px] w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>

            <div className="rounded bg-accent/40 p-3 text-xs text-muted-foreground leading-relaxed">
              <strong>Formal Verification Notice:</strong> Submitting this application initiates an in-person
              verification visit by our Kaduna operations team. No financial disbursement or equipment handover
              occurs without signed physical paperwork and mutual agreement on payment schedules.
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-input bg-surface px-4 py-2 text-sm font-semibold text-navy hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={cn(btn({ variant: "primary", size: "md" }), "font-semibold")}
              >
                {submitting ? "Submitting Application..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
