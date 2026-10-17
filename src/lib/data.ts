import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  companyDefaults,
  telLink,
  waLink,
  waTopic,
  isConfiguredWhatsApp,
  selectDialingPhone,
  COMPANY_WIDE_WA_MESSAGE,
  type CompanyConfig,
} from "@/config/company";
import { defaultMarkups } from "@/lib/installments";
import {
  getPublicSettingsFn,
  getPublicInstallmentRulesFn,
  getPublicTestimonialsFn,
  getPublicGalleryFn,
  getPublicProductsFn,
  getPublicPlotsFn,
  getPublicAgentsFn,
  getPublicCoursesFn,
  getPublicFaqsFn,
} from "@/server/functions/publicData";

export const companyQuery = queryOptions({
  queryKey: ["site_settings", "company"],
  queryFn: async (): Promise<CompanyConfig> => {
    try {
      const settings = await getPublicSettingsFn();
      const v = (settings["company"] ?? {}) as Partial<CompanyConfig>;
      const clean = Object.fromEntries(
        Object.entries(v).filter(([, x]) => typeof x === "string" && x.trim())
      );
      return { ...companyDefaults, ...clean };
    } catch (err) {
      console.warn("Failed to fetch company settings, using defaults:", err);
      return companyDefaults;
    }
  },
  staleTime: 5 * 60_000,
});

/** Company contact details with helpers. Every call and WhatsApp link must go through this. */
export function useCompany() {
  const { data } = useQuery(companyQuery);
  const c = data ?? companyDefaults;
  const dialingPhone = selectDialingPhone(c);
  const hasRealPhone = dialingPhone !== null;
  const hasRealWhatsApp = isConfiguredWhatsApp(c.whatsapp);
  return {
    company: c,
    hasRealPhone,
    hasRealWhatsApp,
    tel: dialingPhone ? telLink(dialingPhone) : "#enquire",
    wa: (topicOrMessage?: string, raw = false) =>
      hasRealWhatsApp
        ? waLink(
            c.whatsapp,
            topicOrMessage
              ? raw
                ? topicOrMessage
                : waTopic(topicOrMessage)
              : COMPANY_WIDE_WA_MESSAGE
          )
        : "#enquire",
  };
}

export const markupsQuery = queryOptions({
  queryKey: ["installment_rules"],
  queryFn: async () => {
    try {
      const rules = await getPublicInstallmentRulesFn();
      if (!rules || Object.keys(rules).length === 0) return defaultMarkups;
      return rules;
    } catch {
      return defaultMarkups;
    }
  },
  staleTime: 5 * 60_000,
});

export function useMarkups() {
  return useQuery(markupsQuery).data ?? defaultMarkups;
}

export const productsQuery = queryOptions({
  queryKey: ["public_products_list"],
  queryFn: async () => {
    return await getPublicProductsFn();
  },
  staleTime: 5 * 60_000,
});

export const plotsQuery = queryOptions({
  queryKey: ["public_plots_list"],
  queryFn: async () => {
    return await getPublicPlotsFn();
  },
  staleTime: 5 * 60_000,
});

export const agentsQuery = queryOptions({
  queryKey: ["public_agents_list"],
  queryFn: async () => {
    return await getPublicAgentsFn();
  },
  staleTime: 5 * 60_000,
});

export const coursesQuery = queryOptions({
  queryKey: ["public_training_courses"],
  queryFn: async () => {
    return await getPublicCoursesFn();
  },
  staleTime: 5 * 60_000,
});

export const testimonialsQuery = (category?: string) =>
  queryOptions({
    queryKey: ["testimonials", category ?? "all"],
    queryFn: async () => {
      const all = await getPublicTestimonialsFn();
      if (!category || category === "all") return all.slice(0, 6);
      return all.filter((t) => t.category === category).slice(0, 6);
    },
  });

export const galleryQuery = (category?: string) =>
  queryOptions({
    queryKey: ["gallery", category ?? "all"],
    queryFn: async () => {
      const all = await getPublicGalleryFn();
      if (!category || category === "all") return all.slice(0, 9);
      return all.filter((g) => g.category === category).slice(0, 9);
    },
  });

export const faqsQuery = queryOptions({
  queryKey: ["public_faqs"],
  queryFn: async () => {
    return await getPublicFaqsFn();
  },
  staleTime: 5 * 60_000,
});
