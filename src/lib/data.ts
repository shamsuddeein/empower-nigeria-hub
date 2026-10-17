import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { companyDefaults, telLink, waLink, waTopic, type CompanyConfig } from "@/config/company";
import { defaultMarkups } from "@/lib/installments";

export const companyQuery = queryOptions({
  queryKey: ["site_settings", "company"],
  queryFn: async (): Promise<CompanyConfig> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "company").maybeSingle();
    const v = (data?.value ?? {}) as Partial<CompanyConfig>;
    const clean = Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string" && x.trim()));
    return { ...companyDefaults, ...clean };
  },
  staleTime: 5 * 60_000,
});

/** Company contact details with helpers. Every call and WhatsApp link must go through this. */
export function useCompany() {
  const { data } = useQuery(companyQuery);
  const c = data ?? companyDefaults;
  return {
    company: c,
    tel: telLink(c.phoneIntl),
    wa: (topicOrMessage: string, raw = false) => waLink(c.whatsapp, raw ? topicOrMessage : waTopic(topicOrMessage)),
  };
}

export const markupsQuery = queryOptions({
  queryKey: ["installment_rules"],
  queryFn: async () => {
    const { data, error } = await supabase.from("installment_rules").select("*").order("duration_months");
    if (error || !data?.length) return defaultMarkups;
    return Object.fromEntries(data.map((r) => [r.duration_months, Number(r.markup_percent)])) as Record<number, number>;
  },
  staleTime: 5 * 60_000,
});

export function useMarkups() {
  return useQuery(markupsQuery).data ?? defaultMarkups;
}

export const testimonialsQuery = (category?: string) =>
  queryOptions({
    queryKey: ["testimonials", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("testimonials").select("*").eq("approved", true).order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q.limit(6);
      if (error) throw error;
      return data;
    },
  });

export const galleryQuery = (category?: string) =>
  queryOptions({
    queryKey: ["gallery", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("gallery").select("*").eq("approved", true).order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q.limit(9);
      if (error) throw error;
      return data;
    },
  });
