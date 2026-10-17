export type Frequency = "weekly" | "monthly";

// Markup percent per duration in months. Admin can override from the installment_rules table.
export const defaultMarkups: Record<number, number> = { 3: 10, 6: 18, 9: 25, 12: 32, 18: 45, 24: 58 };

/** Markup for a duration; custom durations use the closest configured duration at or above, else the largest. */
export function markupFor(months: number, markups: Record<number, number> = defaultMarkups): number {
  const keys = Object.keys(markups).map(Number).sort((a, b) => a - b);
  if (!keys.length) return 0;
  const k = keys.find((d) => d >= months) ?? keys[keys.length - 1];
  return markups[k];
}

export type PlanInput = {
  price: number;
  months: number;
  frequency: Frequency;
  deposit?: number;
  markups?: Record<number, number>;
};

export type PlanResult = {
  perPayment: number;
  payments: number;
  total: number;
  extra: number;
  markupPercent: number;
  financed: number;
};

const roundUp50 = (n: number) => Math.ceil(n / 50) * 50;

/** Pure installment calculation. Weekly uses 52 weeks per year. Payments round up to the nearest N50. */
export function calculatePlan({ price, months, frequency, deposit = 0, markups }: PlanInput): PlanResult {
  const p = Math.max(0, Math.round(price));
  const m = Math.max(1, Math.round(months));
  const d = Math.min(Math.max(0, Math.round(deposit)), p);
  const markupPercent = markupFor(m, markups);
  const financed = p - d;
  const payments = frequency === "weekly" ? Math.ceil((m * 52) / 12) : m;
  const owed = financed * (1 + markupPercent / 100);
  const perPayment = financed === 0 ? 0 : roundUp50(owed / payments);
  const total = perPayment * payments + d;
  return { perPayment, payments, total, extra: total - p, markupPercent, financed };
}
