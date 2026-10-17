// Single source of truth for company contact details.
// Admin can override these from /admin/settings (stored in the site_settings table);
// the values below are used as defaults and before the settings load.
export type CompanyConfig = {
  name: string;
  shortName: string;
  description: string;
  phone: string; // display format, local
  phoneIntl: string; // for tel: links, e.g. +2348000000000
  whatsapp: string; // digits only, international, no plus, e.g. 2348000000000
  email: string;
  address: string;
  mapLink: string;
  hours: string;
  rcNumber: string;
};

export const companyDefaults: CompanyConfig = {
  name: "S.i and Billionaires Hub Nig.Ltd",
  shortName: "S.i and Billionaires Hub",
  description:
    "Commercial solar systems, electric mobility, essential devices, verified land, and financial training on structured instalments across Northern Nigeria.",
  phone: "0800 000 0000",
  phoneIntl: "+2348000000000",
  whatsapp: "2348000000000",
  email: "contact@billionaireshub.ng",
  address: "Kaduna Office, Kaduna State, Nigeria",
  mapLink: "https://maps.google.com/?q=Kaduna+Nigeria",
  hours: "Monday to Saturday, 8:00 AM to 6:00 PM",
  rcNumber: "Registered with CAC Nigeria",
};

export const COMPANY_WIDE_WA_MESSAGE =
  "Hello, I would like to enquire about S.i and Billionaires Hub products and installment plans.";

/**
 * Checks whether a phone number or WhatsApp string is a confirmed, non-placeholder contact.
 * Rejects empty values, known dummy templates, and repetitive/sequential dummy digits,
 * but allows legitimate phone numbers even if they contain consecutive zeros (e.g. 0803 000 1234, 0802 100 0000).
 */
export function isRealContactNumber(num?: string | null): boolean {
  if (!num) return false;
  const trimmed = num.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  // Minimum 7 digits, maximum 15 digits
  if (digits.length < 7 || digits.length > 15) return false;

  // Known placeholder strings
  if (
    trimmed === "0800 000 0000" ||
    trimmed === "+2348000000000" ||
    trimmed === "2348000000000" ||
    digits === "2348000000000" ||
    digits === "08000000000" ||
    digits === "8000000000"
  ) {
    return false;
  }

  // Common placeholder patterns:
  // 1. (234 or 0)? 800 followed exclusively by zeros (e.g. 08000000000, 2348000000000)
  if (/^(234|0)?8000{5,}$/.test(digits)) return false;

  // 2. All same digit (e.g. 0000000000, 1111111111)
  if (/^(\d)\1+$/.test(digits)) return false;

  // 3. Repeated simple sequential placeholder sequences
  if ("0123456789012345".includes(digits) || "9876543210987654".includes(digits)) return false;

  return true;
}

export function isConfiguredPhone(phone?: string | null): boolean {
  return isRealContactNumber(phone);
}

export function isConfiguredWhatsApp(whatsapp?: string | null): boolean {
  return isRealContactNumber(whatsapp);
}

/**
 * Selects the active dialing phone number using the shared validation helper.
 * Prefers phoneIntl when valid, otherwise uses phone when valid, otherwise returns null.
 */
export function selectDialingPhone(company?: { phone?: string | null; phoneIntl?: string | null } | null): string | null {
  if (!company) return null;
  if (isConfiguredPhone(company.phoneIntl)) {
    return company.phoneIntl ?? null;
  }
  if (isConfiguredPhone(company.phone)) {
    return company.phone ?? null;
  }
  return null;
}

export function waLink(whatsapp?: string | null, message: string = "") {
  return `https://wa.me/${(whatsapp ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function waTopic(topic: string) {
  return `Hello, I want to know more about ${topic}.`;
}

export function telLink(phoneIntl?: string | null) {
  return `tel:${(phoneIntl ?? "").replace(/[^\d+]/g, "")}`;
}
