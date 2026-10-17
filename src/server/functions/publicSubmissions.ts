import { createServerFn } from "@tanstack/react-start";
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

export const submitApplicationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as ApplicationSubmissionInput)
  .handler(async ({ data }) => {
    const { handleApplicationSubmission } = await import("../logic/applicationSubmission");
    return handleApplicationSubmission(data);
  });

export const submitLandInquiryFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    plotId?: string | null;
    plotName?: string;
    fullName: string;
    phone: string;
    state: string;
    paymentPlan?: string;
    visitDate?: string;
    message?: string;
  })
  .handler(async ({ data }) => {
    const fullName = data.fullName?.trim() ?? "";
    if (fullName.length < 2 || fullName.length > 100) {
      throw new Error("Full name is required (2 - 100 characters).");
    }

    const phone = data.phone?.trim() ?? "";
    if (!PHONE_REGEX.test(phone)) {
      throw new Error("Valid Nigerian phone number required.");
    }

    const state = data.state?.trim() ?? "";
    if (state.length < 2) {
      throw new Error("State is required.");
    }

    let verifiedPlotId: string | null = null;
    let plotName = data.plotName?.trim() || null;

    if (data.plotId) {
      const plot = await db
        .select()
        .from(schema.plots)
        .where(eq(schema.plots.id, data.plotId))
        .limit(1);

      if (plot.length > 0 && plot[0]) {
        verifiedPlotId = plot[0].id;
        plotName = plot[0].estate_name;
      }
    }

    await db.insert(schema.land_inquiries).values({
      id: crypto.randomUUID(),
      full_name: fullName,
      phone,
      state,
      plot_id: verifiedPlotId,
      plot_name: plotName,
      payment_plan: data.paymentPlan?.trim() || "outright",
      visit_date: data.visitDate?.trim() || null,
      message: data.message?.trim() || null,
      status: "New",
      created_at: new Date(),
    });

    return { success: true };
  });

export const submitAgentApplicationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    fullName: string;
    phone: string;
    whatsapp: string;
    email?: string;
    state: string;
    lga: string;
    town: string;
    type: "Agent" | "Ambassador";
    occupation: string;
    hasShop?: boolean;
    note?: string;
    consent: boolean;
  })
  .handler(async ({ data }) => {
    const fullName = data.fullName?.trim() ?? "";
    if (fullName.length < 2 || fullName.length > 100) {
      throw new Error("Full name is required (2 - 100 characters).");
    }

    const phone = data.phone?.trim() ?? "";
    if (!PHONE_REGEX.test(phone)) {
      throw new Error("Valid Nigerian phone number required.");
    }

    const whatsapp = data.whatsapp?.trim() ?? "";
    if (!PHONE_REGEX.test(whatsapp)) {
      throw new Error("Valid WhatsApp phone number required.");
    }

    const state = data.state?.trim() ?? "";
    if (state.length < 2) {
      throw new Error("State is required.");
    }

    const lga = data.lga?.trim() ?? "";
    if (lga.length < 2) {
      throw new Error("LGA is required.");
    }

    const town = data.town?.trim() ?? "";
    if (town.length < 2) {
      throw new Error("Town is required.");
    }

    const occupation = data.occupation?.trim() ?? "";
    if (occupation.length < 2) {
      throw new Error("Occupation is required.");
    }

    if (!data.consent) {
      throw new Error("Consent to terms is required.");
    }

    await db.insert(schema.agent_applications).values({
      id: crypto.randomUUID(),
      full_name: fullName,
      phone,
      whatsapp,
      email: data.email?.trim() || null,
      state,
      lga,
      town,
      type: data.type === "Ambassador" ? "Ambassador" : "Agent",
      occupation,
      has_shop: Boolean(data.hasShop),
      note: data.note?.trim() || null,
      consent: true,
      status: "Pending",
      created_at: new Date(),
    });

    return { success: true };
  });

export const submitTrainingSignupFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    courseId?: string | null;
    courseTitle?: string;
    fullName: string;
    phone: string;
    email?: string;
    state: string;
    education?: string;
    experience?: string;
  })
  .handler(async ({ data }) => {
    const fullName = data.fullName?.trim() ?? "";
    if (fullName.length < 2 || fullName.length > 100) {
      throw new Error("Full name is required (2 - 100 characters).");
    }

    const phone = data.phone?.trim() ?? "";
    if (!PHONE_REGEX.test(phone)) {
      throw new Error("Valid Nigerian phone number required.");
    }

    const state = data.state?.trim() ?? "";
    if (state.length < 2) {
      throw new Error("State is required.");
    }

    let verifiedCourseId: string | null = null;
    let courseTitle = data.courseTitle?.trim() || "Vocational Training";

    if (data.courseId) {
      const course = await db
        .select()
        .from(schema.training_courses)
        .where(eq(schema.training_courses.id, data.courseId))
        .limit(1);

      if (course.length > 0 && course[0]) {
        verifiedCourseId = course[0].id;
        courseTitle = course[0].title;
      }
    }

    await db.insert(schema.training_signups).values({
      id: crypto.randomUUID(),
      course_id: verifiedCourseId,
      course_title: courseTitle,
      full_name: fullName,
      phone,
      email: data.email?.trim() || null,
      state,
      education: data.education?.trim() || null,
      experience: data.experience?.trim() || null,
      created_at: new Date(),
    });

    return { success: true };
  });

export const submitMessageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    name: string;
    phone: string;
    topic: string;
    message: string;
  })
  .handler(async ({ data }) => {
    const name = data.name?.trim() ?? "";
    if (name.length < 2 || name.length > 100) {
      throw new Error("Full name is required (2 - 100 characters).");
    }

    const phone = data.phone?.trim() ?? "";
    if (!PHONE_REGEX.test(phone)) {
      throw new Error("Valid Nigerian phone number required.");
    }

    const message = data.message?.trim() ?? "";
    if (message.length < 2 || message.length > 2000) {
      throw new Error("Message is required (2 - 2000 characters).");
    }

    const topic = data.topic?.trim() || "general";

    await db.insert(schema.messages).values({
      id: crypto.randomUUID(),
      name,
      phone,
      topic,
      message,
      is_read: false,
      created_at: new Date(),
    });

    return { success: true };
  });
