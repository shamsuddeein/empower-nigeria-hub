export type Frequency = "weekly" | "monthly";

// Approved markup percent per duration in months. Configurable from installment_rules.
export const defaultMarkups: Record<number, number> = {
  3: 10,
  6: 18,
  9: 25,
  12: 32,
  18: 45,
  24: 58,
};

export function isSupportedDuration(
  months: number,
  markups: Record<number, number> = defaultMarkups
): boolean {
  return Number.isInteger(months) && Object.prototype.hasOwnProperty.call(markups, months);
}

/** Lookup markup for an approved duration. Uses next configured tier if not exact. */
export function markupFor(
  months: number,
  markups: Record<number, number> = defaultMarkups
): number {
  const activeMarkups = markups && Object.keys(markups).length > 0 ? markups : defaultMarkups;
  if (activeMarkups[months] !== undefined) {
    return activeMarkups[months];
  }
  const durations = Object.keys(activeMarkups)
    .map(Number)
    .sort((a, b) => a - b);
  if (durations.length === 0) {
    return defaultMarkups[months] ?? 20;
  }
  // Find next configured markup tier >= months
  const nextDuration = durations.find((d) => d >= months);
  if (nextDuration !== undefined && activeMarkups[nextDuration] !== undefined) {
    return activeMarkups[nextDuration];
  }
  // Fall back to the maximum configured duration tier
  const maxDuration = durations[durations.length - 1];
  if (maxDuration !== undefined && activeMarkups[maxDuration] !== undefined) {
    return activeMarkups[maxDuration];
  }
  return defaultMarkups[months] ?? 20;
}

export type PlanInput = {
  price: number; // in Naira
  months: number;
  frequency: Frequency;
  deposit?: number; // in Naira
  upfrontCharges?: number; // in Naira
  markups?: Record<number, number>;
};

export type PlanResult = {
  cashPrice: number;
  deposit: number;
  upfrontCharges: number;
  financed: number;
  totalFinanced: number;
  markupPercent: number;
  extra: number; // financing markup amount in Naira
  total: number; // total payable in Naira
  payments: number; // number of installments
  perPayment: number; // regular installment amount in Naira
  finalPayment: number; // reconciled final installment amount in Naira
  hasDifferentFinalPayment: boolean;
  perPaymentKobo: number;
  finalPaymentKobo: number;
  totalKobo: number;
  financedKobo: number;
  totalFinancedKobo?: number;
  depositKobo: number;
  upfrontChargesKobo: number;
};

const roundUp50 = (n: number) => Math.ceil(n / 50) * 50;

/** Exact payment count for a given duration in months and payment frequency */
export function getPaymentCount(months: number, frequency: Frequency): number {
  if (!Number.isFinite(months) || months <= 0) {
    throw new Error("Months must be a positive number");
  }
  const m = Math.round(months);
  if (frequency === "monthly") return m;
  if (frequency === "weekly") {
    // Standard 52 weeks per year: 3m -> 13, 6m -> 26, 9m -> 39, 12m -> 52
    return Math.round((m * 52) / 12);
  }
  throw new Error(`Unsupported payment frequency: ${frequency}`);
}

/**
 * Authoritative installment calculation using integer kobo.
 * Reconciles the final payment so the schedule equals the approved total exactly.
 */
export function calculatePlan({
  price,
  months,
  frequency,
  deposit = 0,
  upfrontCharges = 0,
  markups = defaultMarkups,
}: PlanInput): PlanResult {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid price: ${price}. Price must be a non-negative finite number.`);
  }
  if (!Number.isFinite(months) || months <= 0) {
    throw new Error(`Invalid duration: ${months}. Duration must be positive.`);
  }
  if (!Number.isFinite(deposit) || deposit < 0) {
    throw new Error(`Invalid deposit: ${deposit}. Deposit must be non-negative.`);
  }
  if (!Number.isFinite(upfrontCharges) || upfrontCharges < 0) {
    throw new Error(`Invalid charges: ${upfrontCharges}. Charges must be non-negative.`);
  }

  const p = Math.round(price);
  const m = Math.round(months);
  const d = Math.round(deposit);
  const u = Math.round(upfrontCharges);

  if (d > p) {
    throw new Error(`Deposit (₦${d.toLocaleString()}) cannot exceed cash price (₦${p.toLocaleString()}).`);
  }

  // Integer kobo calculations
  const priceKobo = p * 100;
  const depositKobo = d * 100;
  const upfrontChargesKobo = u * 100;
  const financedPrincipalKobo = priceKobo - depositKobo;

  const markupPercent = markupFor(m, markups);
  const extraKobo = Math.round((financedPrincipalKobo * markupPercent) / 100);
  const totalFinancedKobo = financedPrincipalKobo + extraKobo;
  const totalPayableKobo = depositKobo + upfrontChargesKobo + totalFinancedKobo;

  const payments = getPaymentCount(m, frequency);

  let perPaymentKobo = 0;
  let finalPaymentKobo = 0;

  if (totalFinancedKobo === 0 || payments === 0) {
    perPaymentKobo = 0;
    finalPaymentKobo = 0;
  } else {
    if (frequency === "weekly") {
      // Clean cash payments: round to nearest 50 Naira (5000 kobo)
      const unroundedPerPaymentNaira = totalFinancedKobo / 100 / payments;
      const roundedNaira = roundUp50(unroundedPerPaymentNaira);
      const tentativePerPaymentKobo = roundedNaira * 100;

      // Check if rounding would leave a negative or overly small final payment
      const tentativeFinalKobo = totalFinancedKobo - tentativePerPaymentKobo * (payments - 1);
      if (tentativeFinalKobo >= tentativePerPaymentKobo * 0.4) {
        perPaymentKobo = tentativePerPaymentKobo;
        finalPaymentKobo = tentativeFinalKobo;
      } else {
        // Fallback to exact integer division if rounding would distort final payment
        perPaymentKobo = Math.floor(totalFinancedKobo / payments);
        finalPaymentKobo = totalFinancedKobo - perPaymentKobo * (payments - 1);
      }
    } else {
      // Monthly uses whole Naira or rounded kobo
      perPaymentKobo = Math.floor(totalFinancedKobo / payments);
      finalPaymentKobo = totalFinancedKobo - perPaymentKobo * (payments - 1);
    }
  }

  // Double check invariant: (payments - 1) * perPaymentKobo + finalPaymentKobo === totalFinancedKobo
  if (payments > 0 && (payments - 1) * perPaymentKobo + finalPaymentKobo !== totalFinancedKobo) {
    throw new Error(
      `Reconciliation internal error: schedule does not reconcile to total financed (${totalFinancedKobo} kobo)`
    );
  }

  const perPayment = perPaymentKobo / 100;
  const finalPayment = finalPaymentKobo / 100;
  const total = totalPayableKobo / 100;
  const extra = extraKobo / 100;
  const financed = financedPrincipalKobo / 100;
  const totalFinanced = totalFinancedKobo / 100;

  return {
    cashPrice: p,
    deposit: d,
    upfrontCharges: u,
    financed,
    totalFinanced,
    markupPercent,
    extra,
    total,
    payments,
    perPayment,
    finalPayment,
    hasDifferentFinalPayment: payments > 1 && finalPaymentKobo !== perPaymentKobo,
    perPaymentKobo,
    finalPaymentKobo,
    totalKobo: totalPayableKobo,
    financedKobo: financedPrincipalKobo,
    totalFinancedKobo,
    depositKobo,
    upfrontChargesKobo,
  };
}
