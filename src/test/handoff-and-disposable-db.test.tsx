import { describe, it, expect, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/server/db/index";
import * as schema from "@/server/db/schema";
import {
  handleApplicationSubmission,
  type ApplicationSubmissionInput,
} from "@/server/logic/applicationSubmission";
import { submitApplicationFn } from "@/server/functions/publicSubmissions";
import { ProductDetailPanel, type ProductDetailItem } from "@/components/site/ProductDetailPanel";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { AdminUser } from "@/lib/adminAuth";

// Mock @tanstack/react-router Link component for jsdom testing
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe("Specification-to-Application Handoff & Disposable Database Integration", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeAll(async () => {
    // Run real Turso/LibSQL migrations against in-memory database
    const migrationsFolder = path.resolve(process.cwd(), "drizzle/migrations_turso");
    await migrate(db, { migrationsFolder });

    // Seed test catalogue products
    await db.insert(schema.products).values([
      {
        id: "cat-prod-solar-1",
        category: "solar",
        name: "3.5kVA Solar Inverter System",
        slug: "3-5kva-solar-inverter-system",
        description: "Pure sine wave inverter with lithium storage for residential use.",
        cash_price: 350000,
        images: "[]",
        specs: JSON.stringify({ inverter: "3.5kVA", battery: "5.1kWh Lithium" }),
        in_stock: true,
        featured: true,
        sort_order: 1,
        is_published: true,
        created_at: new Date(),
      },
      {
        id: "cat-prod-solar-out-of-stock",
        category: "solar",
        name: "5kVA Solar Inverter System",
        slug: "5kva-solar-inverter-system",
        description: "Commercial solar inverter system.",
        cash_price: 650000,
        images: "[]",
        specs: JSON.stringify({ inverter: "5.0kVA" }),
        in_stock: false, // Out of stock
        featured: false,
        sort_order: 2,
        is_published: true,
        created_at: new Date(),
      },
      {
        id: "cat-prod-unpublished",
        category: "solar",
        name: "10kVA Industrial Solar System",
        slug: "10kva-industrial-solar-system",
        description: "Industrial three-phase solar backup.",
        cash_price: 1500000,
        images: "[]",
        specs: JSON.stringify({ inverter: "10kVA 3-Phase" }),
        in_stock: true,
        featured: false,
        sort_order: 3,
        is_published: false, // Unpublished draft
        created_at: new Date(),
      },
      {
        id: "cat-prod-phone-1",
        category: "phone",
        name: "Samsung Galaxy A15 (128GB)",
        slug: "samsung-galaxy-a15-128gb",
        description: "Dual SIM LTE smartphone.",
        cash_price: 195000,
        images: "[]",
        specs: JSON.stringify({ storage: "128GB", ram: "4GB" }),
        in_stock: true,
        featured: true,
        sort_order: 4,
        is_published: true,
        created_at: new Date(),
      },
    ]);
  });

  describe("1. Specification Panel UI & Handoff Contract", () => {
    it("renders 'Apply for This Item' for published catalogue product and passes real ID", async () => {
      let appliedProduct: ProductDetailItem | null = null;
      let appliedDuration = 0;
      let appliedFrequency = "";

      const catalogueItem: ProductDetailItem = {
        id: "cat-prod-solar-1",
        name: "3.5kVA Solar Inverter System",
        category: "solar",
        brand: "Luminous",
        cash_price: 350000,
        description: "High efficiency solar kit.",
        specs: { inverter: "3.5kVA" },
        in_stock: true,
        isAssessment: false,
      };

      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(
          <QueryClientProvider client={queryClient}>
            <ProductDetailPanel
              product={catalogueItem}
              onClose={() => {}}
              onApply={(prod, dur, freq) => {
                appliedProduct = prod;
                appliedDuration = dur;
                appliedFrequency = freq;
              }}
            />
          </QueryClientProvider>
        );
      });

      // Verify DOM content
      const applyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Apply for This Item")
      );
      expect(applyBtn).toBeDefined();

      // Trigger apply
      await act(async () => {
        applyBtn?.click();
      });

      expect(appliedProduct).not.toBeNull();
      const capturedProduct = appliedProduct as ProductDetailItem | null;
      expect(capturedProduct?.id).toBe("cat-prod-solar-1");
      expect(appliedDuration).toBe(6);
      expect(appliedFrequency).toBe("weekly");

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });

    it("renders 'Apply for Assessment' for non-catalogue concept and keeps ID undefined/null", async () => {
      let appliedProduct: ProductDetailItem | null = null;

      const assessmentItem: ProductDetailItem = {
        id: null,
        name: "Commercial Fleet EV Pilot",
        category: "ev",
        cash_price: 1200000,
        description: "Commercial route evaluation.",
        specs: { range: "80km" },
        isAssessment: true,
      };

      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(
          <QueryClientProvider client={queryClient}>
            <ProductDetailPanel
              product={assessmentItem}
              onClose={() => {}}
              onApply={(prod) => {
                appliedProduct = prod;
              }}
            />
          </QueryClientProvider>
        );
      });

      // Verify DOM content
      const applyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Apply for Assessment")
      );
      expect(applyBtn).toBeDefined();
      expect(document.body.textContent).toContain("Indicative System Scope");

      await act(async () => {
        applyBtn?.click();
      });
      const capturedAssessment = appliedProduct as ProductDetailItem | null;
      expect(capturedAssessment?.id).toBeNull();

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });
  });

  describe("2. Public Submissions against In-Memory Disposable DB", () => {
    const baseApplicant = {
      fullName: "Musa Ibrahim",
      phone: "08031234567",
      whatsapp: "08031234567",
      email: "musa@example.com",
      state: "Kaduna",
      lga: "Kaduna North",
      address: "12 Ahmadu Bello Way, Kaduna",
      occupation: "Retail Merchant",
      duration: 6,
      frequency: "weekly" as const,
      deposit: 0,
      upfrontCharges: 0,
    };

    it("verifies submitApplicationFn is properly exported as server function", () => {
      expect(submitApplicationFn).toBeDefined();
    });

    it("accepts valid published in-stock catalogue product with matching expected price", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "cat-prod-solar-1",
        productName: "3.5kVA Solar Inverter System",
        expectedPrice: 350000,
      };

      const result = await handleApplicationSubmission(input);
      expect(result.success).toBe(true);
      expect(result.reference).toMatch(/^SIB-\d{8}-\d{4}$/);

      // Query database to ensure authoritative insertion
      const saved = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.reference, result.reference!))
        .limit(1);

      expect(saved.length).toBe(1);
      const appRecord = saved[0];
      if (!appRecord) throw new Error("Application record not found in test database");
      expect(appRecord.product_id).toBe("cat-prod-solar-1");
      expect(appRecord.product_name).toBe("3.5kVA Solar Inverter System");
      expect(appRecord.price).toBe(350000);
      expect(appRecord.full_name).toBe("Musa Ibrahim");
    });

    it("detects price revisions and returns termsChanged: true without inserting", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "cat-prod-solar-1",
        expectedPrice: 320000, // Client viewed old price of 320k, but DB is 350k
      };

      const result = await handleApplicationSubmission(input);
      expect(result.success).toBe(false);
      expect(result.termsChanged).toBe(true);
      expect(result.currentPrice).toBe(350000);
      expect(result.message).toContain("Product price has been revised");
    });

    it("rejects out-of-stock product to prevent backorders", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "cat-prod-solar-out-of-stock",
        expectedPrice: 650000,
      };

      await expect(handleApplicationSubmission(input)).rejects.toThrow(
        "Selected product is currently out of stock. Backorders are not permitted."
      );
    });

    it("rejects unpublished draft product", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "cat-prod-unpublished",
        expectedPrice: 1500000,
      };

      await expect(handleApplicationSubmission(input)).rejects.toThrow(
        "Selected product is not currently available for applications."
      );
    });

    it("rejects fabricated static product IDs", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "solar-3.5kva", // Old fabricated static ID
        expectedPrice: 350000,
      };

      await expect(handleApplicationSubmission(input)).rejects.toThrow(
        "Selected product was not found."
      );

      const evInput: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: "ev-okada-delivery", // Old fabricated static ID
        expectedPrice: 850000,
      };

      await expect(handleApplicationSubmission(evInput)).rejects.toThrow(
        "Selected product was not found."
      );
    });

    it("routes non-catalogue assessment with productId: null/undefined and saves product_id = null", async () => {
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        productId: null,
        productName: "Commercial Solar Assessment",
        category: "solar",
        price: 850000,
      };

      const result = await handleApplicationSubmission(input);
      expect(result.success).toBe(true);
      expect(result.reference).toBeDefined();

      const saved = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.reference, result.reference!))
        .limit(1);

      expect(saved.length).toBe(1);
      const appRecord = saved[0];
      if (!appRecord) throw new Error("Assessment application record not found");
      expect(appRecord.product_id).toBeNull();
      expect(appRecord.product_name).toBe("Commercial Solar Assessment");
      expect(appRecord.price).toBe(850000);
    });

    it("safely enforces idempotency key on repeated submissions", async () => {
      const idempotencyKey = "unique-test-key-12345";
      const input: ApplicationSubmissionInput = {
        ...baseApplicant,
        idempotencyKey,
        productId: "cat-prod-phone-1",
        expectedPrice: 195000,
      };

      const first = await handleApplicationSubmission(input);
      expect(first.success).toBe(true);

      const second = await handleApplicationSubmission(input);
      expect(second.success).toBe(true);
      expect(second.idempotencyMatch).toBe(true);
      expect(second.reference).toBe(first.reference);

      // Verify only 1 application exists in DB with this idempotency key
      const apps = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.idempotency_key, idempotencyKey));
      expect(apps.length).toBe(1);
    });
  });

  describe("3. Unauthenticated /admin Portal vs Authenticated Management", () => {
    it("renders unauthenticated AdminLogin with portal heading, credentials form, and no internal management tabs", async () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(<AdminLogin onSuccess={() => {}} />);
      });

      // Verify portal title & internal access badge
      expect(document.body.textContent).toContain("Staff Administration Portal");
      expect(document.body.textContent).toContain("Protected Internal Access");
      expect(document.body.textContent).toContain("Authorized staff only.");

      // Verify presence of staff credentials form
      const emailInput = document.querySelector("#staff-email");
      const passwordInput = document.querySelector("#staff-password");
      const submitBtn = document.querySelector("button[type='submit']");

      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
      expect(submitBtn?.textContent).toContain("Sign In to Admin Portal");

      // Verify NO internal management tabs or data tables leak to unauthenticated visitor
      expect(document.body.textContent).not.toContain("Applications Management");
      expect(document.body.textContent).not.toContain("Land Inquiries Management");
      expect(document.body.textContent).not.toContain("Sign Out");

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });

    it("renders authenticated AdminLayout with management dashboard tabs for authorized staff", async () => {
      const mockAdmin: AdminUser = {
        id: "usr-admin-1",
        email: "staff.lead@si-and-billionaires.ng",
        name: "Ibrahim Sani",
        role: "admin",
      };

      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(
          <QueryClientProvider client={queryClient}>
            <AdminLayout user={mockAdmin} onLogout={() => {}} />
          </QueryClientProvider>
        );
      });

      // Verify authenticated dashboard elements
      expect(document.body.textContent).toContain("Staff Admin");
      expect(document.body.textContent).toContain("staff.lead@si-and-billionaires.ng");
      expect(document.body.textContent).toContain("Sign Out");

      // Verify management navigation tabs exist
      const buttons = Array.from(document.querySelectorAll("button")).map((b) => b.textContent?.trim());
      expect(buttons.some((t) => t?.includes("Products"))).toBe(true);
      expect(buttons.some((t) => t?.includes("Applications"))).toBe(true);
      expect(buttons.some((t) => t?.includes("Land & Plots"))).toBe(true);

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });
  });
});
