import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Better Auth Core & Admin Tables (SQLite)
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").default("staff"),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ---------------------------------------------------------------------------
// Business Domain Tables
// ---------------------------------------------------------------------------

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  brand: text("brand"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  cash_price: integer("cash_price").notNull(),
  images: text("images").notNull().default("[]"),
  specs: text("specs").notNull().default("{}"),
  in_stock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: integer("is_published", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const installment_rules = sqliteTable("installment_rules", {
  duration_months: integer("duration_months").primaryKey(),
  markup_percent: real("markup_percent").notNull(),
});

export const plots = sqliteTable("plots", {
  id: text("id").primaryKey(),
  estate_name: text("estate_name").notNull(),
  slug: text("slug").notNull().unique(),
  state: text("state").notNull(),
  town: text("town").notNull(),
  size_sqm: integer("size_sqm").notNull(),
  cash_price: integer("cash_price").notNull(),
  plan_summary: text("plan_summary"),
  monthly_amount: integer("monthly_amount"),
  plan_months: integer("plan_months"),
  status: text("status").notNull().default("Available"),
  documents: text("documents").notNull().default("[]"),
  images: text("images").notNull().default("[]"),
  location_description: text("location_description"),
  landmarks: text("landmarks").notNull().default("[]"),
  map_link: text("map_link"),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: integer("is_published", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  state: text("state").notNull(),
  lga: text("lga"),
  town: text("town"),
  type: text("type").notNull().default("Agent"),
  status: text("status").notNull().default("Approved"),
  show_publicly: integer("show_publicly", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const training_courses = sqliteTable("training_courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  learn: text("learn").notNull().default("[]"),
  duration: text("duration"),
  price: integer("price").notNull().default(0),
  start_date: text("start_date"),
  mode: text("mode").notNull().default("In person"),
  seats_left: integer("seats_left").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const testimonials = sqliteTable("testimonials", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  business: text("business"),
  state: text("state"),
  quote: text("quote").notNull(),
  photo: text("photo"),
  video_url: text("video_url"),
  category: text("category").notNull().default("general"),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const gallery = sqliteTable("gallery", {
  id: text("id").primaryKey(),
  image: text("image"),
  video_url: text("video_url"),
  caption: text("caption"),
  category: text("category").notNull().default("general"),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const faqs = sqliteTable("faqs", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: integer("is_published", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const site_settings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  idempotency_key: text("idempotency_key").unique(),
  category: text("category").notNull(),
  product_id: text("product_id").references(() => products.id, { onDelete: "set null" }),
  product_name: text("product_name").notNull(),
  price: integer("price").notNull(),
  duration: integer("duration").notNull(),
  frequency: text("frequency").notNull(),
  payment_amount: integer("payment_amount"),
  final_payment_amount: integer("final_payment_amount"),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  state: text("state").notNull(),
  lga: text("lga").notNull(),
  address: text("address").notNull(),
  occupation: text("occupation").notNull(),
  status: text("status").notNull().default("New"),
  notes: text("notes"),
  deposit: integer("deposit").notNull().default(0),
  charges: integer("charges").notNull().default(0),
  payment_count: integer("payment_count"),
  total_amount: integer("total_amount"),
  plan_snapshot: text("plan_snapshot").notNull().default("{}"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const land_inquiries = sqliteTable("land_inquiries", {
  id: text("id").primaryKey(),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  state: text("state").notNull(),
  plot_id: text("plot_id").references(() => plots.id, { onDelete: "set null" }),
  plot_name: text("plot_name"),
  payment_plan: text("payment_plan"),
  visit_date: text("visit_date"),
  message: text("message"),
  status: text("status").notNull().default("New"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const agent_applications = sqliteTable("agent_applications", {
  id: text("id").primaryKey(),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email"),
  state: text("state").notNull(),
  lga: text("lga").notNull(),
  town: text("town").notNull(),
  type: text("type").notNull(),
  occupation: text("occupation").notNull(),
  has_shop: integer("has_shop", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  consent: integer("consent", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("Pending"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const training_signups = sqliteTable("training_signups", {
  id: text("id").primaryKey(),
  course_id: text("course_id").references(() => training_courses.id, { onDelete: "set null" }),
  course_title: text("course_title").notNull(),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  state: text("state").notNull(),
  education: text("education"),
  experience: text("experience"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  is_read: integer("is_read", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});
