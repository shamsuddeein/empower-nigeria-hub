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
    "Solar, electric vehicles, phones and land on weekly or monthly payments. Serving Northern Nigeria from our Kaduna office.",
  phone: "0800 000 0000",
  phoneIntl: "+2348000000000",
  whatsapp: "2348000000000",
  email: "info@example.com",
  address: "No. 1 Placeholder Road, Kaduna, Kaduna State",
  mapLink: "https://maps.google.com/?q=Kaduna",
  hours: "Monday to Saturday, 8am to 6pm",
  rcNumber: "RC 0000000",
};

export function waLink(whatsapp: string, message: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function waTopic(topic: string) {
  return `Hello, I want to know more about ${topic}.`;
}

export function telLink(phoneIntl: string) {
  return `tel:${phoneIntl.replace(/[^\d+]/g, "")}`;
}
