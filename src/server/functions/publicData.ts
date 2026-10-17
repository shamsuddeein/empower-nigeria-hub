import { createServerFn } from "@tanstack/react-start";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";

export const getPublicProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: schema.products.id,
      category: schema.products.category,
      brand: schema.products.brand,
      name: schema.products.name,
      slug: schema.products.slug,
      description: schema.products.description,
      cash_price: schema.products.cash_price,
      images: schema.products.images,
      specs: schema.products.specs,
      in_stock: schema.products.in_stock,
      featured: schema.products.featured,
      sort_order: schema.products.sort_order,
      created_at: schema.products.created_at,
    })
    .from(schema.products)
    .where(eq(schema.products.is_published, true))
    .orderBy(asc(schema.products.sort_order), desc(schema.products.created_at));

  return rows.map((r) => {
    let images: string[] = [];
    try {
      images = typeof r.images === "string" ? JSON.parse(r.images) : r.images ?? [];
    } catch {
      images = [];
    }
    let specs: Record<string, any> = {};
    try {
      specs = typeof r.specs === "string" ? JSON.parse(r.specs) : r.specs ?? {};
    } catch {
      specs = {};
    }
    return { ...r, images, specs };
  });
});

export const getPublicInstallmentRulesFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select()
    .from(schema.installment_rules)
    .orderBy(asc(schema.installment_rules.duration_months));

  const markups: Record<number, number> = {};
  for (const r of rows) {
    markups[r.duration_months] = r.markup_percent;
  }
  return markups;
});

export const getPublicPlotsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: schema.plots.id,
      estate_name: schema.plots.estate_name,
      slug: schema.plots.slug,
      state: schema.plots.state,
      town: schema.plots.town,
      size_sqm: schema.plots.size_sqm,
      cash_price: schema.plots.cash_price,
      plan_summary: schema.plots.plan_summary,
      monthly_amount: schema.plots.monthly_amount,
      plan_months: schema.plots.plan_months,
      status: schema.plots.status,
      documents: schema.plots.documents,
      images: schema.plots.images,
      location_description: schema.plots.location_description,
      landmarks: schema.plots.landmarks,
      map_link: schema.plots.map_link,
      sort_order: schema.plots.sort_order,
      created_at: schema.plots.created_at,
    })
    .from(schema.plots)
    .where(eq(schema.plots.is_published, true))
    .orderBy(asc(schema.plots.sort_order), desc(schema.plots.created_at));

  return rows.map((r) => {
    let images: string[] = [];
    try {
      images = typeof r.images === "string" ? JSON.parse(r.images) : r.images ?? [];
    } catch {
      images = [];
    }
    let documents: string[] = [];
    try {
      documents = typeof r.documents === "string" ? JSON.parse(r.documents) : r.documents ?? [];
    } catch {
      documents = [];
    }
    let landmarks: string[] = [];
    try {
      landmarks = typeof r.landmarks === "string" ? JSON.parse(r.landmarks) : r.landmarks ?? [];
    } catch {
      landmarks = [];
    }
    return { ...r, images, documents, landmarks };
  });
});

export const getPublicAgentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: schema.agents.id,
      name: schema.agents.name,
      phone: schema.agents.phone,
      whatsapp: schema.agents.whatsapp,
      state: schema.agents.state,
      lga: schema.agents.lga,
      town: schema.agents.town,
      type: schema.agents.type,
    })
    .from(schema.agents)
    .where(eq(schema.agents.status, "Approved"));

  // Only return agents configured to show publicly
  return rows;
});

export const getPublicCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: schema.training_courses.id,
      title: schema.training_courses.title,
      slug: schema.training_courses.slug,
      learn: schema.training_courses.learn,
      duration: schema.training_courses.duration,
      price: schema.training_courses.price,
      start_date: schema.training_courses.start_date,
      mode: schema.training_courses.mode,
      seats_left: schema.training_courses.seats_left,
    })
    .from(schema.training_courses)
    .where(eq(schema.training_courses.active, true))
    .orderBy(desc(schema.training_courses.created_at));

  return rows.map((r) => {
    let learn: string[] = [];
    try {
      learn = typeof r.learn === "string" ? JSON.parse(r.learn) : r.learn ?? [];
    } catch {
      learn = [];
    }
    return { ...r, learn };
  });
});

export const getPublicTestimonialsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select({
      id: schema.testimonials.id,
      name: schema.testimonials.name,
      business: schema.testimonials.business,
      state: schema.testimonials.state,
      quote: schema.testimonials.quote,
      photo: schema.testimonials.photo,
      video_url: schema.testimonials.video_url,
      category: schema.testimonials.category,
    })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.approved, true))
    .orderBy(desc(schema.testimonials.created_at));
});

export const getPublicGalleryFn = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select({
      id: schema.gallery.id,
      image: schema.gallery.image,
      video_url: schema.gallery.video_url,
      caption: schema.gallery.caption,
      category: schema.gallery.category,
    })
    .from(schema.gallery)
    .where(eq(schema.gallery.approved, true))
    .orderBy(desc(schema.gallery.created_at));
});

export const getPublicFaqsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select({
      id: schema.faqs.id,
      topic: schema.faqs.topic,
      question: schema.faqs.question,
      answer: schema.faqs.answer,
      sort_order: schema.faqs.sort_order,
    })
    .from(schema.faqs)
    .where(eq(schema.faqs.is_published, true))
    .orderBy(asc(schema.faqs.sort_order));
});

export const getPublicSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.select().from(schema.site_settings);
  const settings: Record<string, any> = {};
  for (const r of rows) {
    try {
      settings[r.key] = typeof r.value === "string" ? JSON.parse(r.value) : r.value;
    } catch {
      settings[r.key] = r.value;
    }
  }
  return settings;
});
