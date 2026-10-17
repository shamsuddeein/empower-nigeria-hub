import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { calculatePlan, isSupportedDuration, defaultMarkups } from "../../lib/installments";

const PHONE_REGEX = /^0[789][01][0-9]{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SIB-${year}${month}${day}-${rand}`;
}

export type ApplicationSubmissionInput = {
  idempotencyKey?: string;
  category?: string;
  productId?: string | null;
  productName?: string;
  expectedPrice?: number;
  price?: number;
  duration: number;
  frequency: "weekly" | "monthly";
  deposit?: number;
  upfrontCharges?: number;
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  state: string;
  lga: string;
  address: string;
  occupation: string;
};

export async function handleApplicationSubmission(data: ApplicationSubmissionInput) {
  // 1. Idempotency Check
  if (data.idempotencyKey) {
    const existing = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.idempotency_key, data.idempotencyKey))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      const app = existing[0];
      let plan = {};
      try {
        plan = JSON.parse(app.plan_snapshot);
      } catch {
        plan = {};
      }
      return {
        success: true,
        reference: app.reference,
        idempotencyMatch: true,
        message: "Application previously submitted and recorded.",
        plan,
      };
    }
  }

  // 2. Validate applicant required fields
  const fullName = data.fullName?.trim() ?? "";
  if (fullName.length < 2 || fullName.length > 100) {
    throw new Error("Full name is required (2 - 100 characters).");
  }

  const phone = data.phone?.trim() ?? "";
  if (!PHONE_REGEX.test(phone)) {
    throw new Error("Valid Nigerian phone number required (e.g. 08031234567).");
  }

  const whatsapp = data.whatsapp?.trim();
  if (whatsapp && !PHONE_REGEX.test(whatsapp)) {
    throw new Error("WhatsApp number must be a valid Nigerian phone number.");
  }

  const email = data.email?.trim();
  if (email && !EMAIL_REGEX.test(email)) {
    throw new Error("Please provide a valid email address.");
  }

  const state = data.state?.trim() ?? "";
  if (state.length < 2) {
    throw new Error("State is required.");
  }

  const lga = data.lga?.trim() ?? "Central";
  const address = data.address?.trim() ?? "";
  if (address.length < 3) {
    throw new Error("Business or residential address is required.");
  }

  const occupation = data.occupation?.trim() ?? "";
  if (occupation.length < 2) {
    throw new Error("Business trade or occupation is required.");
  }

  const duration = Number(data.duration);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
    throw new Error("Valid repayment duration in months is required.");
  }

  const frequency = data.frequency;
  if (frequency !== "weekly" && frequency !== "monthly") {
    throw new Error("Payment frequency must be 'weekly' or 'monthly'.");
  }

  // 3. Authoritative Product and Price verification
  let resolvedPrice = 0;
  let resolvedProductName = data.productName?.trim() ?? "Equipment Assessment Application";
  let resolvedCategory = data.category?.trim() ?? "solar";
  let verifiedProductId: string | null = null;

  if (data.productId) {
    const prods = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, data.productId))
      .limit(1);

    if (prods.length === 0 || !prods[0]) {
      throw new Error("Selected product was not found.");
    }

    const prod = prods[0];
    if (!prod.is_published) {
      throw new Error("Selected product is not currently available for applications.");
    }

    if (!prod.in_stock) {
      throw new Error("Selected product is currently out of stock. Backorders are not permitted.");
    }

    // Check if price changed from customer's quote
    if (data.expectedPrice != null && data.expectedPrice !== prod.cash_price) {
      return {
        success: false,
        termsChanged: true,
        message: "Product price has been revised since you viewed the catalogue. Please review the updated terms.",
        currentPrice: prod.cash_price,
      };
    }

    resolvedPrice = prod.cash_price;
    resolvedProductName = prod.name;
    resolvedCategory = prod.category;
    verifiedProductId = prod.id;
  } else {
    // General equipment inquiry / assessment path
    resolvedPrice = Number(data.price);
    if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
      throw new Error("Valid equipment price or estimate is required.");
    }
  }

  // 4. Authoritative Markup & Calculation
  const ruleRows = await db.select().from(schema.installment_rules);
  const markups: Record<number, number> = {};
  if (ruleRows.length > 0) {
    for (const r of ruleRows) {
      markups[r.duration_months] = r.markup_percent;
    }
  } else {
    Object.assign(markups, defaultMarkups);
  }

  if (!isSupportedDuration(duration, markups)) {
    throw new Error(
      `Duration of ${duration} months is not currently offered. Supported plans: ${Object.keys(markups).join(", ")} months.`
    );
  }

  const plan = calculatePlan({
    price: resolvedPrice,
    months: duration,
    frequency,
    deposit: Number(data.deposit ?? 0),
    upfrontCharges: Number(data.upfrontCharges ?? 0),
    markups,
  });

  // 5. Unique Reference Allocation
  let reference = "";
  for (let i = 0; i < 30; i++) {
    const candidate = generateReference();
    const existing = await db
      .select({ id: schema.applications.id })
      .from(schema.applications)
      .where(eq(schema.applications.reference, candidate))
      .limit(1);

    if (existing.length === 0) {
      reference = candidate;
      break;
    }
  }

  if (!reference) {
    throw new Error("Could not allocate a unique application reference. Please try again.");
  }

  // 6. Insert Authoritative Application Record
  const applicationId = crypto.randomUUID();
  await db.insert(schema.applications).values({
    id: applicationId,
    reference,
    idempotency_key: data.idempotencyKey?.trim() || null,
    category: resolvedCategory,
    product_id: verifiedProductId,
    product_name: resolvedProductName,
    price: plan.cashPrice,
    duration,
    frequency,
    payment_amount: plan.perPayment,
    final_payment_amount: plan.finalPayment,
    deposit: plan.deposit,
    charges: plan.upfrontCharges,
    payment_count: plan.payments,
    total_amount: plan.total,
    plan_snapshot: JSON.stringify(plan),
    full_name: fullName,
    phone,
    whatsapp: whatsapp || null,
    email: email || null,
    state,
    lga,
    address,
    occupation,
    status: "New",
    notes: null,
    created_at: new Date(),
  });

  return {
    success: true,
    reference,
    plan,
  };
}
