import { createServerFn } from "@tanstack/react-start";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { requireAdminSession } from "../auth/session";

// ---------------------------------------------------------------------------
// Overview Metrics
// ---------------------------------------------------------------------------

export const getAdminOverviewFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();

  const [appsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.applications);
  const [newAppsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(eq(schema.applications.status, "New"));

  const [agentsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.agents);
  const [pendingAgentsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.agent_applications)
    .where(eq(schema.agent_applications.status, "Pending"));

  const [messagesCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.messages);
  const [unreadMessagesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.messages)
    .where(eq(schema.messages.is_read, false));

  const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.products);
  const [plotsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.plots);
  const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.training_courses);

  return {
    totalApplications: Number(appsCount?.count ?? 0),
    newApplications: Number(newAppsCount?.count ?? 0),
    totalAgents: Number(agentsCount?.count ?? 0),
    pendingAgentApplications: Number(pendingAgentsCount?.count ?? 0),
    totalMessages: Number(messagesCount?.count ?? 0),
    unreadMessages: Number(unreadMessagesCount?.count ?? 0),
    totalProducts: Number(productsCount?.count ?? 0),
    totalPlots: Number(plotsCount?.count ?? 0),
    totalCourses: Number(coursesCount?.count ?? 0),
  };
});

// ---------------------------------------------------------------------------
// Products CRUD
// ---------------------------------------------------------------------------

export const listAdminProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const rows = await db
    .select()
    .from(schema.products)
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

export const createProductFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    category: string;
    brand?: string;
    name: string;
    slug: string;
    description?: string;
    cashPrice: number;
    images?: string[];
    specs?: Record<string, any>;
    inStock?: boolean;
    featured?: boolean;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const id = crypto.randomUUID();
    const result = await db.insert(schema.products).values({
      id,
      category: data.category,
      brand: data.brand || null,
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description || null,
      cash_price: Number(data.cashPrice),
      images: JSON.stringify(data.images ?? []),
      specs: JSON.stringify(data.specs ?? {}),
      in_stock: data.inStock ?? true,
      featured: data.featured ?? false,
      sort_order: Number(data.sortOrder ?? 0),
      // Default to draft (false) unless explicitly published by staff
      is_published: data.isPublished ?? false,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create product.");
    }
    return { success: true, id };
  });

export const updateProductFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    category?: string;
    brand?: string;
    name?: string;
    slug?: string;
    description?: string;
    cashPrice?: number;
    images?: string[];
    specs?: Record<string, any>;
    inStock?: boolean;
    featured?: boolean;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const updates: Partial<typeof schema.products.$inferInsert> = {};
    if (data.category !== undefined) updates.category = data.category;
    if (data.brand !== undefined) updates.brand = data.brand || null;
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.slug !== undefined) updates.slug = data.slug.trim().toLowerCase();
    if (data.description !== undefined) updates.description = data.description || null;
    if (data.cashPrice !== undefined) updates.cash_price = Number(data.cashPrice);
    if (data.images !== undefined) updates.images = JSON.stringify(data.images);
    if (data.specs !== undefined) updates.specs = JSON.stringify(data.specs);
    if (data.inStock !== undefined) updates.in_stock = data.inStock;
    if (data.featured !== undefined) updates.featured = data.featured;
    if (data.sortOrder !== undefined) updates.sort_order = Number(data.sortOrder);
    if (data.isPublished !== undefined) updates.is_published = data.isPublished;

    const result = await db
      .update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, data.id));

    if (result.rowsAffected === 0) {
      throw new Error("Product update failed: item not found.");
    }
    return { success: true };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.products).where(eq(schema.products.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Product deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Installment Rules
// ---------------------------------------------------------------------------

export const listAdminInstallmentRulesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db
    .select()
    .from(schema.installment_rules)
    .orderBy(asc(schema.installment_rules.duration_months));
});

export const upsertInstallmentRuleFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { durationMonths: number; markupPercent: number })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const duration = Number(data.durationMonths);
    const markup = Number(data.markupPercent);

    if (duration <= 0 || markup < 0) {
      throw new Error("Duration must be positive and markup must be non-negative.");
    }

    const existing = await db
      .select()
      .from(schema.installment_rules)
      .where(eq(schema.installment_rules.duration_months, duration))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.installment_rules)
        .set({ markup_percent: markup })
        .where(eq(schema.installment_rules.duration_months, duration));
    } else {
      await db.insert(schema.installment_rules).values({
        duration_months: duration,
        markup_percent: markup,
      });
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Plots CRUD
// ---------------------------------------------------------------------------

export const listAdminPlotsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const rows = await db
    .select()
    .from(schema.plots)
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

export const createPlotFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    estateName: string;
    slug: string;
    state: string;
    town: string;
    sizeSqm: number;
    cashPrice: number;
    planSummary?: string;
    monthlyAmount?: number;
    planMonths?: number;
    status?: string;
    documents?: string[];
    images?: string[];
    locationDescription?: string;
    landmarks?: string[];
    mapLink?: string;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.plots).values({
      id,
      estate_name: data.estateName.trim(),
      slug: data.slug.trim().toLowerCase(),
      state: data.state.trim(),
      town: data.town.trim(),
      size_sqm: Number(data.sizeSqm),
      cash_price: Number(data.cashPrice),
      plan_summary: data.planSummary || null,
      monthly_amount: data.monthlyAmount ? Number(data.monthlyAmount) : null,
      plan_months: data.planMonths ? Number(data.planMonths) : null,
      status: data.status || "Available",
      documents: JSON.stringify(data.documents ?? []),
      images: JSON.stringify(data.images ?? []),
      location_description: data.locationDescription || null,
      landmarks: JSON.stringify(data.landmarks ?? []),
      map_link: data.mapLink || null,
      sort_order: Number(data.sortOrder ?? 0),
      // Default to draft (false)
      is_published: data.isPublished ?? false,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create plot.");
    }
    return { success: true, id };
  });

export const updatePlotFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    estateName?: string;
    slug?: string;
    state?: string;
    town?: string;
    sizeSqm?: number;
    cashPrice?: number;
    planSummary?: string;
    monthlyAmount?: number;
    planMonths?: number;
    status?: string;
    documents?: string[];
    images?: string[];
    locationDescription?: string;
    landmarks?: string[];
    mapLink?: string;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const updates: Partial<typeof schema.plots.$inferInsert> = {};
    if (data.estateName !== undefined) updates.estate_name = data.estateName.trim();
    if (data.slug !== undefined) updates.slug = data.slug.trim().toLowerCase();
    if (data.state !== undefined) updates.state = data.state.trim();
    if (data.town !== undefined) updates.town = data.town.trim();
    if (data.sizeSqm !== undefined) updates.size_sqm = Number(data.sizeSqm);
    if (data.cashPrice !== undefined) updates.cash_price = Number(data.cashPrice);
    if (data.planSummary !== undefined) updates.plan_summary = data.planSummary || null;
    if (data.monthlyAmount !== undefined) updates.monthly_amount = data.monthlyAmount ? Number(data.monthlyAmount) : null;
    if (data.planMonths !== undefined) updates.plan_months = data.planMonths ? Number(data.planMonths) : null;
    if (data.status !== undefined) updates.status = data.status;
    if (data.documents !== undefined) updates.documents = JSON.stringify(data.documents);
    if (data.images !== undefined) updates.images = JSON.stringify(data.images);
    if (data.locationDescription !== undefined) updates.location_description = data.locationDescription || null;
    if (data.landmarks !== undefined) updates.landmarks = JSON.stringify(data.landmarks);
    if (data.mapLink !== undefined) updates.map_link = data.mapLink || null;
    if (data.sortOrder !== undefined) updates.sort_order = Number(data.sortOrder);
    if (data.isPublished !== undefined) updates.is_published = data.isPublished;

    const result = await db.update(schema.plots).set(updates).where(eq(schema.plots.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Plot update failed: item not found.");
    }
    return { success: true };
  });

export const deletePlotFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.plots).where(eq(schema.plots.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Plot deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Agents & Agent Applications (Atomic & Idempotent Approval)
// ---------------------------------------------------------------------------

export const listAdminAgentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db.select().from(schema.agents).orderBy(desc(schema.agents.created_at));
});

export const listAdminAgentApplicationsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db
    .select()
    .from(schema.agent_applications)
    .orderBy(desc(schema.agent_applications.created_at));
});

export const approveAgentApplicationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { applicationId: string })
  .handler(async ({ data }) => {
    await requireAdminSession();

    return await db.transaction(async (tx) => {
      const apps = await tx
        .select()
        .from(schema.agent_applications)
        .where(eq(schema.agent_applications.id, data.applicationId))
        .limit(1);

      if (apps.length === 0 || !apps[0]) {
        throw new Error("Agent application not found.");
      }

      const app = apps[0];

      // Check if already approved
      if (app.status === "Approved") {
        const existingAgents = await tx
          .select()
          .from(schema.agents)
          .where(eq(schema.agents.phone, app.phone))
          .limit(1);

        return {
          success: true,
          message: "Application is already approved.",
          agentId: existingAgents[0]?.id,
        };
      }

      // Check if agent already exists with this phone
      const existingAgents = await tx
        .select()
        .from(schema.agents)
        .where(eq(schema.agents.phone, app.phone))
        .limit(1);

      let agentId = existingAgents[0]?.id;

      if (!agentId) {
        agentId = crypto.randomUUID();
        await tx.insert(schema.agents).values({
          id: agentId,
          name: app.full_name,
          phone: app.phone,
          whatsapp: app.whatsapp,
          state: app.state,
          lga: app.lga,
          town: app.town,
          type: app.type,
          status: "Approved",
          show_publicly: false,
          created_at: new Date(),
        });
      }

      const updateResult = await tx
        .update(schema.agent_applications)
        .set({ status: "Approved" })
        .where(eq(schema.agent_applications.id, data.applicationId));

      if (updateResult.rowsAffected === 0) {
        throw new Error("Failed to update application status.");
      }

      return { success: true, agentId };
    });
  });

export const createAgentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    name: string;
    phone: string;
    whatsapp?: string;
    state: string;
    lga?: string;
    town?: string;
    type?: string;
    status?: string;
    showPublicly?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.agents).values({
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || null,
      state: data.state.trim(),
      lga: data.lga?.trim() || null,
      town: data.town?.trim() || null,
      type: data.type || "Agent",
      status: data.status || "Approved",
      show_publicly: data.showPublicly ?? true,
      created_at: new Date(),
    });
    if (result.rowsAffected === 0) {
      throw new Error("Failed to create agent.");
    }
    return { success: true, id };
  });

export const updateAgentApplicationStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; status: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db
      .update(schema.agent_applications)
      .set({ status: data.status })
      .where(eq(schema.agent_applications.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Agent application not found.");
    }
    return { success: true };
  });

export const updateAgentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    state?: string;
    lga?: string;
    town?: string;
    type?: string;
    status?: string;
    showPublicly?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const updates: Partial<typeof schema.agents.$inferInsert> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.phone !== undefined) updates.phone = data.phone.trim();
    if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp?.trim() || null;
    if (data.state !== undefined) updates.state = data.state.trim();
    if (data.lga !== undefined) updates.lga = data.lga?.trim() || null;
    if (data.town !== undefined) updates.town = data.town?.trim() || null;
    if (data.type !== undefined) updates.type = data.type;
    if (data.status !== undefined) updates.status = data.status;
    if (data.showPublicly !== undefined) updates.show_publicly = data.showPublicly;

    const result = await db.update(schema.agents).set(updates).where(eq(schema.agents.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Agent update failed: item not found.");
    }
    return { success: true };
  });

export const deleteAgentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.agents).where(eq(schema.agents.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Agent deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Applications Management
// ---------------------------------------------------------------------------

export const listAdminApplicationsFn = createServerFn({ method: "GET" })
  .validator((input?: unknown) => {
    if (typeof input === "string") {
      return { status: input, category: undefined };
    }
    if (input && typeof input === "object") {
      const obj = input as { status?: string; category?: string };
      return {
        status: obj.status,
        category: obj.category,
      };
    }
    return { status: undefined, category: undefined };
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const conditions = [];
    if (data?.status && data.status !== "all") {
      conditions.push(eq(schema.applications.status, data.status));
    }
    if (data?.category && data.category !== "all") {
      conditions.push(eq(schema.applications.category, data.category));
    }

    let query = db.select().from(schema.applications);
    if (conditions.length === 1) {
      query = query.where(conditions[0]) as typeof query;
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = await query.orderBy(desc(schema.applications.created_at));
    return rows.map((r) => {
      let plan = {};
      try {
        plan = r.plan_snapshot ? JSON.parse(r.plan_snapshot) : {};
      } catch {
        plan = {};
      }
      return { ...r, plan };
    });
  });

export const updateApplicationStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    status: "New" | "Contacted" | "Approved" | "Rejected" | "Completed";
    notes?: string;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const allowed = ["New", "Contacted", "Approved", "Rejected", "Completed"];
    if (!allowed.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}. Allowed statuses are: ${allowed.join(", ")}`);
    }

    const updates: Partial<typeof schema.applications.$inferInsert> = {
      status: data.status,
    };
    if (data.notes !== undefined) {
      updates.notes = data.notes;
    }

    const result = await db
      .update(schema.applications)
      .set(updates)
      .where(eq(schema.applications.id, data.id));

    if (result.rowsAffected === 0) {
      throw new Error("Application update failed: record not found.");
    }
    return { success: true };
  });

export const updateApplicationNotesFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; notes: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db
      .update(schema.applications)
      .set({ notes: data.notes })
      .where(eq(schema.applications.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Application not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Training Courses & Signups
// ---------------------------------------------------------------------------

export const listAdminCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const rows = await db
    .select()
    .from(schema.training_courses)
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

export const listAdminTrainingSignupsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db
    .select()
    .from(schema.training_signups)
    .orderBy(desc(schema.training_signups.created_at));
});

export const createCourseFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    title: string;
    slug: string;
    learn?: string[];
    duration?: string;
    price?: number;
    startDate?: string;
    mode?: string;
    seatsLeft?: number;
    active?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.training_courses).values({
      id,
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      learn: JSON.stringify(data.learn ?? []),
      duration: data.duration || null,
      price: Number(data.price ?? 0),
      start_date: data.startDate || null,
      mode: data.mode || "In person",
      seats_left: Number(data.seatsLeft ?? 0),
      active: data.active ?? false,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create training course.");
    }
    return { success: true, id };
  });

export const updateCourseFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    title?: string;
    slug?: string;
    learn?: string[];
    duration?: string;
    price?: number;
    startDate?: string;
    mode?: string;
    seatsLeft?: number;
    active?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const updates: Partial<typeof schema.training_courses.$inferInsert> = {};
    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.slug !== undefined) updates.slug = data.slug.trim().toLowerCase();
    if (data.learn !== undefined) updates.learn = JSON.stringify(data.learn);
    if (data.duration !== undefined) updates.duration = data.duration || null;
    if (data.price !== undefined) updates.price = Number(data.price);
    if (data.startDate !== undefined) updates.start_date = data.startDate || null;
    if (data.mode !== undefined) updates.mode = data.mode;
    if (data.seatsLeft !== undefined) updates.seats_left = Number(data.seatsLeft);
    if (data.active !== undefined) updates.active = data.active;

    const result = await db
      .update(schema.training_courses)
      .set(updates)
      .where(eq(schema.training_courses.id, data.id));

    if (result.rowsAffected === 0) {
      throw new Error("Course update failed: item not found.");
    }
    return { success: true };
  });

export const deleteCourseFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db
      .delete(schema.training_courses)
      .where(eq(schema.training_courses.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Course deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Testimonials & Gallery
// ---------------------------------------------------------------------------

export const listAdminTestimonialsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db
    .select()
    .from(schema.testimonials)
    .orderBy(desc(schema.testimonials.created_at));
});

export const createTestimonialFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    name: string;
    business?: string;
    state?: string;
    quote: string;
    photo?: string;
    videoUrl?: string;
    category?: string;
    approved?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.testimonials).values({
      id,
      name: data.name.trim(),
      business: data.business?.trim() || null,
      state: data.state?.trim() || null,
      quote: data.quote.trim(),
      photo: data.photo?.trim() || null,
      video_url: data.videoUrl?.trim() || null,
      category: data.category?.trim() || "general",
      approved: data.approved ?? false,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create testimonial.");
    }
    return { success: true, id };
  });

export const updateTestimonialFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    name?: string;
    business?: string;
    state?: string;
    quote?: string;
    photo?: string;
    videoUrl?: string;
    category?: string;
    approved?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const updates: Partial<typeof schema.testimonials.$inferInsert> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.business !== undefined) updates.business = data.business?.trim() || null;
    if (data.state !== undefined) updates.state = data.state?.trim() || null;
    if (data.quote !== undefined) updates.quote = data.quote.trim();
    if (data.photo !== undefined) updates.photo = data.photo?.trim() || null;
    if (data.videoUrl !== undefined) updates.video_url = data.videoUrl?.trim() || null;
    if (data.category !== undefined) updates.category = data.category.trim();
    if (data.approved !== undefined) updates.approved = data.approved;

    const result = await db
      .update(schema.testimonials)
      .set(updates)
      .where(eq(schema.testimonials.id, data.id));

    if (result.rowsAffected === 0) {
      throw new Error("Testimonial update failed: item not found.");
    }
    return { success: true };
  });

export const deleteTestimonialFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.testimonials).where(eq(schema.testimonials.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Testimonial deletion failed: item not found.");
    }
    return { success: true };
  });

export const listAdminGalleryFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db.select().from(schema.gallery).orderBy(desc(schema.gallery.created_at));
});

export const createGalleryItemFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    image?: string;
    videoUrl?: string;
    caption?: string;
    category?: string;
    approved?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.gallery).values({
      id,
      image: data.image?.trim() || null,
      video_url: data.videoUrl?.trim() || null,
      caption: data.caption?.trim() || null,
      category: data.category?.trim() || "general",
      approved: data.approved ?? false,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create gallery item.");
    }
    return { success: true, id };
  });

export const updateGalleryItemFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    image?: string;
    videoUrl?: string;
    caption?: string;
    category?: string;
    approved?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const updates: Partial<typeof schema.gallery.$inferInsert> = {};
    if (data.image !== undefined) updates.image = data.image?.trim() || null;
    if (data.videoUrl !== undefined) updates.video_url = data.videoUrl?.trim() || null;
    if (data.caption !== undefined) updates.caption = data.caption?.trim() || null;
    if (data.category !== undefined) updates.category = data.category.trim();
    if (data.approved !== undefined) updates.approved = data.approved;

    const result = await db.update(schema.gallery).set(updates).where(eq(schema.gallery.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Gallery item update failed: item not found.");
    }
    return { success: true };
  });

export const deleteGalleryItemFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.gallery).where(eq(schema.gallery.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Gallery item deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export const listAdminFaqsFn = createServerFn({ method: "GET" })
  .validator((data?: { topic?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession();
    if (data?.topic && data.topic !== "all") {
      return await db
        .select()
        .from(schema.faqs)
        .where(eq(schema.faqs.topic, data.topic))
        .orderBy(asc(schema.faqs.sort_order));
    }
    return await db.select().from(schema.faqs).orderBy(asc(schema.faqs.sort_order));
  });


export const createFaqFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    topic: string;
    question: string;
    answer: string;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const id = crypto.randomUUID();
    const result = await db.insert(schema.faqs).values({
      id,
      topic: data.topic.trim(),
      question: data.question.trim(),
      answer: data.answer.trim(),
      sort_order: Number(data.sortOrder ?? 0),
      is_published: data.isPublished ?? true,
      created_at: new Date(),
    });

    if (result.rowsAffected === 0) {
      throw new Error("Failed to create FAQ.");
    }
    return { success: true, id };
  });

export const updateFaqFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as {
    id: string;
    topic?: string;
    question?: string;
    answer?: string;
    sortOrder?: number;
    isPublished?: boolean;
  })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const updates: Partial<typeof schema.faqs.$inferInsert> = {};
    if (data.topic !== undefined) updates.topic = data.topic.trim();
    if (data.question !== undefined) updates.question = data.question.trim();
    if (data.answer !== undefined) updates.answer = data.answer.trim();
    if (data.sortOrder !== undefined) updates.sort_order = Number(data.sortOrder);
    if (data.isPublished !== undefined) updates.is_published = data.isPublished;

    const result = await db.update(schema.faqs).set(updates).where(eq(schema.faqs.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("FAQ update failed: item not found.");
    }
    return { success: true };
  });

export const deleteFaqFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.faqs).where(eq(schema.faqs.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("FAQ deletion failed: item not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const getAdminSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
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

export const updateAdminSettingFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { key: string; value: unknown })
  .handler(async ({ data }) => {
    await requireAdminSession();

    const valStr = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
    const existing = await db
      .select()
      .from(schema.site_settings)
      .where(eq(schema.site_settings.key, data.key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.site_settings)
        .set({ value: valStr, updated_at: new Date() })
        .where(eq(schema.site_settings.key, data.key));
    } else {
      await db.insert(schema.site_settings).values({
        key: data.key,
        value: valStr,
        updated_at: new Date(),
      });
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Land Inquiries
// ---------------------------------------------------------------------------

export const listAdminLandInquiriesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return await db
    .select()
    .from(schema.land_inquiries)
    .orderBy(desc(schema.land_inquiries.created_at));
});

export const updateLandInquiryStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; status: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db
      .update(schema.land_inquiries)
      .set({ status: data.status })
      .where(eq(schema.land_inquiries.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Land inquiry not found.");
    }
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Messages & Contact Inquiries
// ---------------------------------------------------------------------------

export const listAdminMessagesFn = createServerFn({ method: "GET" })
  .validator((data?: { topic?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession();
    if (data?.topic && data.topic !== "all") {
      return await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.topic, data.topic))
        .orderBy(desc(schema.messages.created_at));
    }
    return await db
      .select()
      .from(schema.messages)
      .orderBy(desc(schema.messages.created_at));
  });


export const toggleMessageReadFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; isRead: boolean })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db
      .update(schema.messages)
      .set({ is_read: data.isRead })
      .where(eq(schema.messages.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Message not found.");
    }
    return { success: true };
  });

export const deleteMessageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    await requireAdminSession();
    const result = await db.delete(schema.messages).where(eq(schema.messages.id, data.id));
    if (result.rowsAffected === 0) {
      throw new Error("Message deletion failed: item not found.");
    }
    return { success: true };
  });

