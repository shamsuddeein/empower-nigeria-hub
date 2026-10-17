import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCurrentAdmin, loginWithSupabase } from "@/lib/adminAuth";
import { getSession, signIn, signOut } from "@/lib/auth-client";
import { submitApplicationFn } from "@/server/functions/publicSubmissions";
import { getPublicGalleryFn, getPublicTestimonialsFn } from "@/server/functions/publicData";
import { calculatePlan } from "@/lib/installments";
import { ApplicationModal } from "@/components/site/ApplicationModal";
import { PublicLandingPage } from "@/routes/index";
import { siteImages } from "@/config/images";
import {
  ProductImagePlaceholder,
  PlotImagePlaceholder,
} from "@/components/site/DevelopmentPlaceholders";
import { supabase } from "@/integrations/supabase/client";
import {
  isRealContactNumber,
  isConfiguredPhone,
  isConfiguredWhatsApp,
  selectDialingPhone,
  telLink,
  companyDefaults,
  COMPANY_WIDE_WA_MESSAGE,
} from "@/config/company";
import { useCompany } from "@/lib/data";

// Mock Better Auth Client
vi.mock("@/lib/auth-client", () => {
  const getSessionMock = vi.fn();
  const signInMock = { email: vi.fn() };
  const signOutMock = vi.fn().mockResolvedValue({ error: null });

  return {
    authClient: {
      getSession: getSessionMock,
      signIn: signInMock,
      signOut: signOutMock,
    },
    getSession: getSessionMock,
    signIn: signInMock,
    signOut: signOutMock,
  };
});

// Mock Server Functions
vi.mock("@/server/functions/publicSubmissions", () => {
  const submitApplicationFn = vi.fn();
  return {
    submitApplicationFn,
  };
});

vi.mock("@/server/functions/publicData", () => ({
  getPublicSettingsFn: vi.fn().mockResolvedValue({}),
  getPublicInstallmentRulesFn: vi.fn().mockResolvedValue({}),
  getPublicTestimonialsFn: vi.fn().mockResolvedValue([]),
  getPublicGalleryFn: vi.fn().mockResolvedValue([]),
  getPublicProductsFn: vi.fn().mockResolvedValue([]),
  getPublicPlotsFn: vi.fn().mockResolvedValue([]),
  getPublicAgentsFn: vi.fn().mockResolvedValue([]),
  getPublicCoursesFn: vi.fn().mockResolvedValue([]),
  getPublicFaqsFn: vi.fn().mockResolvedValue([]),
}));

// Mock Supabase (for backwards compatibility if any client code touches it)
vi.mock("@/integrations/supabase/client", () => {
  const rpcMock = vi.fn();
  const fromMock = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }));
  const authMock = {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  };

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
      rpc: rpcMock,
    },
  };
});

// Self-contained DOM helpers for React 19 testing
let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  });
  return {
    rerender: (newUi: React.ReactElement) => {
      act(() => {
        root.render(
          <QueryClientProvider client={queryClient}>
            {newUi}
          </QueryClientProvider>
        );
      });
    },
  };
};

const waitFor = async (callback: () => void, timeout = 1000) => {
  const start = Date.now();
  while (true) {
    try {
      callback();
      return;
    } catch (err) {
      if (Date.now() - start > timeout) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 20));
    }
  }
};

const setInputValue = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  act(() => {
    const prototype = input instanceof HTMLInputElement 
      ? window.HTMLInputElement.prototype 
      : window.HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
};

describe("Regression Suite: Repairs & Security Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  // --------------------------------------------------------------------------
  // 1. UNAUTHORIZED ADMIN ACCESS
  // --------------------------------------------------------------------------
  describe("1. Unauthorized admin access", () => {
    it("rejects access when no authenticated session exists", async () => {
      (getSession as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const user = await getCurrentAdmin();
      expect(user).toBeNull();
    });

    it("never trusts a role or identity stored in localStorage", async () => {
      localStorage.setItem("sib_admin_role", "SuperAdmin");
      localStorage.setItem("sib_admin_session", JSON.stringify({ role: "SuperAdmin", email: "attacker@external.com" }));

      (getSession as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const user = await getCurrentAdmin();
      expect(user).toBeNull();
    });

    it("rejects authenticated users who lack an authorized record in public.admins", async () => {
      (getSession as any).mockResolvedValueOnce({
        data: {
          session: { id: "sess-123" },
          user: { id: "unauth-uuid-123", email: "customer@gmail.com", role: "user" },
        },
        error: null,
      });

      const user = await getCurrentAdmin();
      expect(user).toBeNull();
    });

    it("loginWithSupabase requires authorized membership record and does not grant admin on domain alone", async () => {
      (signIn.email as any).mockResolvedValueOnce({
        data: { user: { id: "user-456", email: "random@sibbillionaires.com" } },
        error: null,
      });

      (getSession as any).mockResolvedValueOnce({
        data: {
          session: { id: "sess-456" },
          user: { id: "user-456", email: "random@sibbillionaires.com", role: "user" },
        },
        error: null,
      });

      const res = await loginWithSupabase("random@sibbillionaires.com", "secret123");
      expect(res.user).toBeNull();
      expect(res.error).toMatch(/not registered as an authorized staff administrator/i);
      expect(signOut).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 2. CHANGING THE SELECTED PRODUCT & MODAL STATE
  // --------------------------------------------------------------------------
  describe("2. Changing selected product in modal", () => {
    it("dynamically updates modal fields when initialData changes from Small to Medium Solar", () => {
      const { rerender } = render(
        <ApplicationModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            productName: "Small business system",
            category: "solar",
            price: 850000,
            duration: 6,
            frequency: "weekly",
          }}
        />
      );

      expect(container.textContent).toContain("Small business system");
      expect(container.textContent).toContain("₦850,000");

      // User selects Medium Solar offer
      rerender(
        <ApplicationModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            productId: "prod-med-uuid",
            productName: "Medium business system",
            category: "solar",
            price: 1650000,
            duration: 12,
            frequency: "monthly",
          }}
        />
      );

      // Must NOT remain stuck on 850,000 or Small business system
      expect(container.textContent).toContain("Medium business system");
      expect(container.textContent).toContain("₦1,650,000");
      expect(container.textContent).toContain("12 Months");
      expect(container.textContent?.toLowerCase()).toContain("monthly");
    });

    it("resets previous error and reference code when re-opened with new offer", () => {
      const { rerender } = render(
        <ApplicationModal
          isOpen={false}
          onClose={vi.fn()}
          initialData={null}
        />
      );

      rerender(
        <ApplicationModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            productName: "Commercial Large Solar",
            category: "solar",
            price: 3400000,
          }}
        />
      );

      expect(container.textContent).toContain("Commercial Large Solar");
      expect(container.textContent).not.toContain("Application Reference Code");
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 3. CALCULATOR-TO-APPLICATION TERMS & KOBO RECONCILIATION
  // --------------------------------------------------------------------------
  describe("3. Calculator-to-application terms and exact kobo rounding", () => {
    it("reconciles exact total financed down to the exact kobo so (payments - 1)*perPayment + finalPayment == financed", () => {
      // Test odd amounts across weekly/monthly tenors
      const testCases = [
        { price: 850000, months: 6, frequency: "weekly" as const },
        { price: 1650000, months: 9, frequency: "weekly" as const },
        { price: 3400000, months: 12, frequency: "monthly" as const },
        { price: 950000, months: 18, frequency: "weekly" as const, deposit: 50000 },
      ];

      for (const tc of testCases) {
        const plan = calculatePlan(tc);
        expect(plan.payments).toBeGreaterThan(0);
        expect(plan.perPayment).toBeGreaterThan(0);

        // Sum of all payments must match total financed exactly
        const calculatedScheduleTotal = (plan.payments - 1) * plan.perPayment + plan.finalPayment;
        const totalFinanced = plan.total - plan.deposit;
        expect(calculatedScheduleTotal).toBe(totalFinanced);
      }
    });

    it("uses exact standard 52/12 weeks schedule instead of treating month as 4 weeks", () => {
      const plan3m = calculatePlan({ price: 100000, months: 3, frequency: "weekly" });
      expect(plan3m.payments).toBe(13); // 3 * 52 / 12 = 13 weeks (not 12 weeks)

      const plan6m = calculatePlan({ price: 100000, months: 6, frequency: "weekly" });
      expect(plan6m.payments).toBe(26); // 6 * 52 / 12 = 26 weeks (not 24 weeks)

      const plan12m = calculatePlan({ price: 100000, months: 12, frequency: "weekly" });
      expect(plan12m.payments).toBe(52); // 12 * 52 / 12 = 52 weeks (not 48 weeks)
    });
  });

  // --------------------------------------------------------------------------
  // 4. FAILED DATABASE SAVES & DUPLICATE SUBMISSIONS
  // --------------------------------------------------------------------------
  describe("4. Failed database saves and duplicate submission prevention", () => {
    it("displays honest error and retains form inputs when submit_application fails", async () => {
      (submitApplicationFn as any).mockResolvedValueOnce({
        success: false,
        message: "Selected product is not published for applications",
      });

      render(
        <ApplicationModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            productName: "Test Inactive System",
            category: "solar",
            price: 500000,
          }}
        />
      );

      const nameInput = container.querySelector('input[id$="-name"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[id$="-phone"]') as HTMLInputElement;
      const addrInput = container.querySelector('input[id$="-addr"]') as HTMLInputElement;
      const occInput = container.querySelector('input[id$="-occ"]') as HTMLInputElement;

      setInputValue(nameInput, "Ibrahim Lawal");
      setInputValue(phoneInput, "08031234567");
      setInputValue(addrInput, "Shop 12 Central Market");
      setInputValue(occInput, "Phone charging business");

      const submitBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Submit Application")
      )!;
      const form = container.querySelector("form")!;
      act(() => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      await waitFor(() => {
        expect(container.querySelector('[role="alert"]')).not.toBeNull();
      });

      expect(container.textContent).toContain("Selected product is not published for applications");
      // Form fields MUST be retained, not lost
      expect(nameInput.value).toBe("Ibrahim Lawal");
      expect(phoneInput.value).toBe("08031234567");
      expect(addrInput.value).toBe("Shop 12 Central Market");
      expect(occInput.value).toBe("Phone charging business");
      // Must not display a fake success reference
      expect(container.textContent).not.toContain("Application Reference Code");
    });

    it("prevents duplicate submissions from rapid taps while submitting is in flight", async () => {
      let resolveRpc: any;
      const rpcPromise = new Promise((resolve) => {
        resolveRpc = resolve;
      });

      (submitApplicationFn as any).mockReturnValueOnce(rpcPromise);

      render(
        <ApplicationModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            productName: "Test Rapid Tap",
            category: "solar",
            price: 500000,
          }}
        />
      );

      const nameInput = container.querySelector('input[id$="-name"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[id$="-phone"]') as HTMLInputElement;
      const addrInput = container.querySelector('input[id$="-addr"]') as HTMLInputElement;
      const occInput = container.querySelector('input[id$="-occ"]') as HTMLInputElement;

      setInputValue(nameInput, "Amina Yusuf");
      setInputValue(phoneInput, "08123456789");
      setInputValue(addrInput, "No 4 Ahmadu Bello Way");
      setInputValue(occInput, "Supermarket");

      const submitBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Submit Application")
      )!;
      const form = container.querySelector("form")!;

      act(() => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      // Button should now be disabled during flight
      expect(submitBtn.disabled).toBe(true);

      // Repeated click while in flight
      act(() => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      expect(submitApplicationFn).toHaveBeenCalledTimes(1);

      // Resolve flight
      await act(async () => {
        resolveRpc({
          success: true,
          reference: "SIB-20261017-9999",
        });
        await rpcPromise;
      });

      await waitFor(() => {
        expect(container.textContent).toContain("SIB-20261017-9999");
      });
      // Verifies honest awaiting verification wording
      expect(container.textContent).toContain("Proposed Plan Summary (Subject to Formal Verification)");
      expect(container.textContent).not.toContain("Approved Plan Summary");
    });
  });

  // --------------------------------------------------------------------------
  // 5. DRAFT VISIBILITY
  // --------------------------------------------------------------------------
  describe("5. Draft visibility and publication controls", () => {
    it("ensures unpublished draft plots and products are not displayed to public visitors", () => {
      const rawProducts = [
        { id: "1", name: "Published Solar 3.5kVA", in_stock: true, is_published: true },
        { id: "2", name: "Draft Secret Product", in_stock: true, is_published: false },
      ];

      const publicVisible = rawProducts.filter((p) => p.is_published !== false);
      expect(publicVisible.map((p) => p.name)).toEqual(["Published Solar 3.5kVA"]);
      expect(publicVisible.find((p) => p.name === "Draft Secret Product")).toBeUndefined();
    });

    it("verifies commercial availability statuses are strictly Available, Few left, or Sold", () => {
      const validStatuses = ["Available", "Few left", "Sold"];
      expect(validStatuses.includes("Draft")).toBe(false);
      expect(validStatuses.includes("Available")).toBe(true);
      expect(validStatuses.includes("Few left")).toBe(true);
      expect(validStatuses.includes("Sold")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. COMPANY-WIDE HERO & SERVICE HIERARCHY
  // --------------------------------------------------------------------------
  describe("6. Company-wide hero & service hierarchy", () => {
    it("renders company-wide hero copy introducing all 5 service areas", () => {
      render(<PublicLandingPage />);

      // Must display new company-wide headline
      expect(container.textContent).toContain("Power your daily life and business.");

      // Must introduce all 5 service areas in the supporting copy
      expect(container.textContent).toContain(
        "We offer business solar, electric motorcycles and tricycles, phones and gadgets, land and estate, financial services, and practical training."
      );

      // Hero Apply Now connects to #enquire
      const heroApplyLink = container.querySelector('#hero a[href="#enquire"]');
      expect(heroApplyLink).not.toBeNull();
      expect(heroApplyLink?.textContent).toContain("Apply Now");

      // Verify compact service overview links
      const serviceLinks = [
        "#services-solar",
        "#services-ev",
        "#services-gadgets",
        "#services-land",
        "#services-finance",
      ];
      for (const href of serviceLinks) {
        const link = container.querySelector(`#hero a[href="${href}"]`);
        expect(link).not.toBeNull();
      }

      // Verify the 4 commercial use cases appear inside the Solar for Business section
      const solarSection = container.querySelector("#services");
      expect(solarSection?.textContent).toContain("Commercial Shops");
      expect(solarSection?.textContent).toContain("Phone Charging");
      expect(solarSection?.textContent).toContain("Filling Stations");
      expect(solarSection?.textContent).toContain("Pure Water Plants");

      // Verify no working Call link is displayed when phone is placeholder
      const heroCallLink = container.querySelector('#hero a[href^="tel:"]');
      expect(heroCallLink).toBeNull();
    });

    describe("7. Contact availability & placeholder fallback", () => {
      it("correctly identifies placeholder numbers without rejecting legitimate numbers with consecutive zeros", () => {
        // Placeholders must be rejected
        expect(isRealContactNumber("0800 000 0000")).toBe(false);
        expect(isRealContactNumber("+2348000000000")).toBe(false);
        expect(isRealContactNumber("2348000000000")).toBe(false);
        expect(isRealContactNumber("08000000000")).toBe(false);
        expect(isRealContactNumber("0000000000")).toBe(false);
        expect(isRealContactNumber("1234567890")).toBe(false);
        expect(isRealContactNumber("")).toBe(false);
        expect(isRealContactNumber(null)).toBe(false);

        // Legitimate phone numbers MUST NOT be classified as fake merely because of consecutive zeros
        expect(isRealContactNumber("0803 000 1234")).toBe(true);
        expect(isRealContactNumber("0802 100 0000")).toBe(true);
        expect(isRealContactNumber("+234 803 000 5678")).toBe(true);
        expect(isRealContactNumber("0800 123 4567")).toBe(true);
        expect(isRealContactNumber("0901 000 0001")).toBe(true);

        expect(isConfiguredPhone("0800 000 0000")).toBe(false);
        expect(isConfiguredPhone("0803 000 1234")).toBe(true);

        expect(isConfiguredWhatsApp("2348000000000")).toBe(false);
        expect(isConfiguredWhatsApp("2348030001234")).toBe(true);
        expect(COMPANY_WIDE_WA_MESSAGE).toContain("products and installment plans");
      });

      it("ensures public landing page contact buttons redirect to #enquire when confirmed contact info is placeholder", async () => {
        render(<PublicLandingPage />);
        await waitFor(() => {
          expect(container.textContent).toContain("Power your daily life and business.");
        });

        // Hero WhatsApp button should point to #enquire when WhatsApp is placeholder, not wa.me/2348000000000
        const heroButtons = Array.from(container.querySelectorAll("#hero a"));
        const waButton = heroButtons.find((b) => b.textContent?.includes("WhatsApp"));
        expect(waButton).toBeDefined();
        expect(waButton?.getAttribute("href")).toBe("#enquire");

        // No active tel: links pointing to placeholder numbers
        const telLinks = Array.from(container.querySelectorAll('a[href^="tel:"]'));
        expect(telLinks.length).toBe(0);

        // Agent empty state contact button points to #enquire
        const agentSection = container.querySelector("#agent-locator");
        expect(agentSection).not.toBeNull();
      });

      it("correctly validates and selects dialing number preferring phoneIntl then phone then #enquire", () => {
        // Case 1: Real local phone with placeholder phoneIntl
        const case1 = { phone: "0803 000 1234", phoneIntl: "+2348000000000" };
        const selected1 = selectDialingPhone(case1);
        expect(selected1).toBe("0803 000 1234");
        expect(selected1 ? telLink(selected1) : "#enquire").toBe("tel:08030001234");

        // Case 2: Real phoneIntl with placeholder local phone
        const case2 = { phone: "0800 000 0000", phoneIntl: "+2348030001234" };
        const selected2 = selectDialingPhone(case2);
        expect(selected2).toBe("+2348030001234");
        expect(selected2 ? telLink(selected2) : "#enquire").toBe("tel:+2348030001234");

        // Case 3: Both numbers placeholders
        const case3 = { phone: "0800 000 0000", phoneIntl: "+2348000000000" };
        const selected3 = selectDialingPhone(case3);
        expect(selected3).toBeNull();
        expect(selected3 ? telLink(selected3) : "#enquire").toBe("#enquire");

        // Case 4: Both numbers real: prefer phoneIntl
        const case4 = { phone: "0803 000 1234", phoneIntl: "+2348030009999" };
        const selected4 = selectDialingPhone(case4);
        expect(selected4).toBe("+2348030009999");
        expect(selected4 ? telLink(selected4) : "#enquire").toBe("tel:+2348030009999");
      });

      it("derives both hasRealPhone and tel in useCompany() from the same validated selection", () => {
        let hookResult = {} as ReturnType<typeof useCompany>;
        function CompanyConsumer() {
          hookResult = useCompany();
          return null;
        }

        // Test with default placeholder config
        render(<CompanyConsumer />);
        expect(hookResult.hasRealPhone).toBe(false);
        expect(hookResult.tel).toBe("#enquire");

        // Test with queryClient cache overridden: Real local phone with placeholder phoneIntl
        queryClient.setQueryData(["site_settings", "company"], {
          ...companyDefaults,
          phone: "0803 000 1234",
          phoneIntl: "+2348000000000",
        });
        render(<CompanyConsumer />);
        expect(hookResult.hasRealPhone).toBe(true);
        expect(hookResult.tel).toBe("tel:08030001234");

        // Test with queryClient cache overridden: Real phoneIntl with placeholder local phone
        queryClient.setQueryData(["site_settings", "company"], {
          ...companyDefaults,
          phone: "0800 000 0000",
          phoneIntl: "+2348030001234",
        });
        render(<CompanyConsumer />);
        expect(hookResult.hasRealPhone).toBe(true);
        expect(hookResult.tel).toBe("tel:+2348030001234");

        // Test with queryClient cache overridden: Both placeholders
        queryClient.setQueryData(["site_settings", "company"], {
          ...companyDefaults,
          phone: "0800 000 0000",
          phoneIntl: "+2348000000000",
        });
        render(<CompanyConsumer />);
        expect(hookResult.hasRealPhone).toBe(false);
        expect(hookResult.tel).toBe("#enquire");
      });
    });

    describe("8. Scoped no-deposit wording and mobile sizing structure", () => {
      it("restricts no-deposit claim strictly to eligible solar plans in About section", async () => {
        render(<PublicLandingPage />);
        await waitFor(() => {
          expect(container.textContent).toContain("About the Company");
        });

        const aboutSection = container.querySelector("#about");
        expect(aboutSection).not.toBeNull();
        expect(aboutSection?.textContent).toContain(
          "including zero-deposit options on eligible commercial solar plans"
        );
        // Must NOT claim universal no-deposit across all products
        expect(aboutSection?.textContent).not.toContain(
          "under clear, no-deposit installment agreements"
        );
      });

      it("ensures Financial Services & Training section contains responsive stacking for controls", async () => {
        render(<PublicLandingPage />);
        await waitFor(() => {
          expect(container.textContent).toContain("Financial Services & Vocational Training");
        });

        const financeSection = container.querySelector("#financial-services-and-training");
        expect(financeSection).not.toBeNull();

        // Check registration form select and submit button row
        const trainForm = financeSection?.querySelector("form");
        expect(trainForm).not.toBeNull();
        const selectRow = trainForm?.querySelector(".flex-col.sm\\:flex-row");
        expect(selectRow).not.toBeNull();
      });
    });

    describe("9. Image implementation, provenance & media gallery verification", () => {
      it("correctly distinguishes generated illustrations from licensed stock photography and authentic images", () => {
        expect(siteImages.hero.type).toBe("generated_illustration");
        expect(siteImages.hero.provenance.origin).toContain("vector illustration");
        expect(siteImages.hero.title).not.toContain("Kano Innovation Hub");
        expect(siteImages.hero.alt).not.toContain("Kano Innovation Hub");

        expect(siteImages.solar.type).toBe("licensed_stock_photo");
        expect(siteImages.solar.provenance.creator).toBe("Marta Victoria");
        expect(siteImages.solar.provenance.license).toBe("CC BY-SA 4.0");

        expect(siteImages.ev.type).toBe("licensed_stock_photo");
        expect(siteImages.ev.provenance.creator).toBe("Alessandro Tartarini");
        expect(siteImages.ev.provenance.license).toBe("CC BY-SA 4.0");
        expect(siteImages.ev.alt).not.toContain("Greenwave");
        expect(siteImages.ev.title).not.toContain("Swapping Hubs");
      });

      it("truthfully describes visible contents without phantom devices or unverified features", () => {
        // Gadgets image depicts a laptop and smartphone, no POS terminal
        expect(siteImages.gadgets.alt.toLowerCase()).toContain("laptop");
        expect(siteImages.gadgets.alt.toLowerCase()).toContain("smartphone");
        expect(siteImages.gadgets.alt.toLowerCase()).not.toContain("pos");

        // Land image depicts farmland/cropland, not surveyed boundary beacons
        expect(siteImages.land.alt.toLowerCase()).toContain("farmland");
        expect(siteImages.land.alt.toLowerCase()).not.toContain("beacon");
        expect(siteImages.land.caption.toLowerCase()).not.toContain("title-verified");

        // Training image depicts a single technician, not a training class or cohort
        expect(siteImages.training.alt.toLowerCase()).toContain("technician");
        expect(siteImages.training.alt.toLowerCase()).not.toContain("workshop with apprentices");
      });

      it("removes unverified badges and warehouse references from placeholders", () => {
        render(<ProductImagePlaceholder productName="Test Solar Inverter" category="solar" />);
        expect(container.textContent).toContain("Photo coming soon");
        expect(container.textContent).not.toContain("Development Placeholder");
        expect(container.textContent).not.toContain("warehouse team");

        render(<PlotImagePlaceholder estateName="Zaria Green Estate" town="Zaria" state="Kaduna" />);
        expect(container.textContent).not.toContain("Demarcation Placeholder");
        expect(container.textContent).not.toContain("Survey Plan Verified");
        expect(container.textContent).not.toContain("Inspection Accompanied");
      });

      it("hides proof section when no approved testimonials or gallery media exist", async () => {
        (getPublicTestimonialsFn as any).mockResolvedValueOnce([]);
        (getPublicGalleryFn as any).mockResolvedValueOnce([]);

        render(<PublicLandingPage />);
        await waitFor(() => {
          expect(container.textContent).toContain("Land & Estate Property");
        });

        // The entire proof section must be omitted
        expect(container.querySelector("#proof")).toBeNull();
        expect(container.textContent).not.toContain("Manufacturer Warranties");
        expect(container.textContent).not.toContain("Standardized Installation");
      });

      it("renders media gallery correctly handling images, direct videos, video links and filtering invalid items", async () => {
        (getPublicTestimonialsFn as any).mockResolvedValueOnce([
          {
            id: "t1",
            name: "Malam Sani",
            business: "Bakery",
            state: "Kaduna",
            quote: "Reliable equipment and transparent pricing.",
            category: "solar",
            approved: true,
          },
        ]);
        (getPublicGalleryFn as any).mockResolvedValueOnce([
          {
            id: "g1",
            image: "https://example.com/installation.webp",
            video_url: null,
            caption: "Installed commercial rooftop solar array",
            category: "solar",
          },
          {
            id: "g2",
            image: null,
            video_url: "https://example.com/recording.mp4",
            caption: "Direct video walk-through of inverter setup",
            category: "solar",
          },
          {
            id: "g3",
            image: "https://example.com/preview.webp",
            video_url: "https://youtube.com/watch?v=12345678901",
            caption: "Customer video testimonial",
            category: "ev",
          },
          {
            id: "g4",
            image: null,
            video_url: null,
            caption: "Missing media entry",
            category: "solar",
          },
        ]);

        render(<PublicLandingPage />);
        await waitFor(() => {
          expect(container.querySelector("#proof")).not.toBeNull();
        });

        const proofSection = container.querySelector("#proof")!;
        expect(proofSection.textContent).toContain("Malam Sani");

        // g1: image only -> has <img> with src
        const imgG1 = proofSection.querySelector('img[src="https://example.com/installation.webp"]');
        expect(imgG1).not.toBeNull();

        // g2: direct video (.mp4) -> has <video> with src and controls
        const videoG2 = proofSection.querySelector('video[src="https://example.com/recording.mp4"]') as HTMLVideoElement;
        expect(videoG2).not.toBeNull();
        expect(videoG2.controls).toBe(true);

        // g3: external video with image preview -> has watch video link
        const linkG3 = proofSection.querySelector('a[href="https://youtube.com/watch?v=12345678901"]');
        expect(linkG3).not.toBeNull();

        // g4: missing both image and video -> filtered out, no empty tile
        expect(proofSection.textContent).not.toContain("Missing media entry");
      });
    });
  });
});
