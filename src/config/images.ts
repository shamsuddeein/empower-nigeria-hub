/**
 * Image Assets Registry and Photographic Direction Configuration
 * 
 * Centralized metadata, responsive sources, explicit dimensions, alt text,
 * provenance records, and attribution guidelines for S.I & Billionaires Hub Nig. Ltd.
 * 
 * Rules:
 * 1. General service introduction imagery must never be presented as
 *    company staff, customers, property, or completed work.
 * 2. Generated illustrations must be clearly distinguished from genuine photographs.
 * 3. Alt text must describe actual visible content rather than query prompts or claims.
 * 4. Specific inventory items, plots, staff, and customer stories require
 *    authentic company photographs; until supplied, use neutral placeholders.
 * 5. All images specify explicit dimensions (width/height) to prevent layout shift.
 * 6. Below-the-fold images load lazily; the hero visual is prioritized.
 */

export interface ImageProvenance {
  origin: string;
  sourceUrl?: string;
  creator?: string;
  license?: string;
  licenseUrl?: string;
}

export interface ServiceImageMeta {
  id: string;
  category: "hero" | "solar" | "ev" | "gadgets" | "land" | "training";
  title: string;
  alt: string;
  caption: string;
  description: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  aspectRatio: string;
  type: "licensed_stock_photo" | "generated_illustration" | "company_authentic_photo";
  provenance: ImageProvenance;
  attribution: string;
  replacementNotes: string;
}

export const siteImages = {
  hero: {
    id: "hero-ecosystem",
    category: "hero",
    title: "Commercial Services Multi-Sector Overview",
    alt: "Restrained architectural vector illustration depicting rooftop solar panels, electric delivery scooter, and business laptop and phone",
    caption: "Commercial enterprise solutions: solar power, electric mobility, technology devices, and property listings.",
    description: "Restrained vector illustration depicting core enterprise sectors: solar power, clean mobility, business tools, and land reference without fictional signage or external branding.",
    src: "/images/hero-ecosystem.webp",
    srcSet: "/images/hero-ecosystem-600.webp 600w, /images/hero-ecosystem.webp 1200w",
    width: 600,
    height: 400,
    aspectRatio: "3/2",
    type: "generated_illustration",
    provenance: {
      origin: "In-house restrained vector illustration",
      creator: "Design Team",
      license: "Proprietary / In-house illustrative asset",
    },
    attribution: "Restrained conceptual vector illustration of integrated service sectors. Contains no external or fictional business affiliations.",
    replacementNotes: "Replace with a high-resolution 3:2 landscape photograph of your Kaduna headquarters or active multi-service showcase.",
  },

  solar: {
    id: "service-solar",
    category: "solar",
    title: "Rooftop Solar Photovoltaic Installation",
    alt: "Rooftop solar photovoltaic panel installation on tiled commercial roof",
    caption: "Commercial solar solutions: rooftop photovoltaic panel arrays for business and institutional power.",
    description: "Photovoltaic solar panel modules installed on a building rooftop under clear daytime sunlight.",
    src: "/images/service-solar.webp",
    srcSet: "/images/service-solar-600.webp 600w, /images/service-solar.webp 1200w",
    width: 600,
    height: 338,
    aspectRatio: "16/9",
    type: "licensed_stock_photo",
    provenance: {
      origin: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Rooftop_solar_photovoltaic_installation.jpg",
      creator: "Marta Victoria",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    attribution: "Photo: Marta Victoria / Wikimedia Commons / CC BY-SA 4.0. General service introduction photograph.",
    replacementNotes: "Replace with an on-site photograph of a completed company commercial solar installation in Kaduna, Kano, or Katsina.",
  },

  ev: {
    id: "service-ev",
    category: "ev",
    title: "Electric Commercial Delivery Scooter",
    alt: "Electric cargo delivery scooter with rear carrier rack parked beside a concrete wall",
    caption: "Electric commercial mobility: purpose-built electric cargo motorcycles and delivery scooters.",
    description: "An electric cargo utility scooter designed for last-mile logistics, with rear luggage carrier and digital instrumentation.",
    src: "/images/service-ev.webp",
    srcSet: "/images/service-ev-600.webp 600w, /images/service-ev.webp 1200w",
    width: 600,
    height: 338,
    aspectRatio: "16/9",
    type: "licensed_stock_photo",
    provenance: {
      origin: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Oliver-Velocifero.jpg",
      creator: "Alessandro Tartarini",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    attribution: "Photo: Alessandro Tartarini / Wikimedia Commons / CC BY-SA 4.0. Commercial mobility category photography; vehicle specifications vary by inventory.",
    replacementNotes: "Replace with high-res photograph of company electric bikes and tricycles in your Kaduna delivery depot.",
  },

  gadgets: {
    id: "service-gadgets",
    category: "gadgets",
    title: "Business Laptop and Smartphone",
    alt: "A modern slim laptop and a smartphone with a dark textured protective case on a white workspace desk",
    caption: "Business productivity tools: contemporary laptops and smartphones available on installment plans.",
    description: "A contemporary slim laptop and smartphone arranged on a clean white desk surface, representing digital commercial tools.",
    src: "/images/service-gadgets.webp",
    srcSet: "/images/service-gadgets-600.webp 600w, /images/service-gadgets.webp 1200w",
    width: 600,
    height: 338,
    aspectRatio: "16/9",
    type: "licensed_stock_photo",
    provenance: {
      origin: "Unsplash stock photography",
      license: "Unsplash Free Commercial License",
      licenseUrl: "https://unsplash.com/license",
    },
    attribution: "General product category photography. Exact gadget models, storage configurations, and specifications listed in catalogue.",
    replacementNotes: "Replace with retail showroom photography from company sales counter.",
  },

  land: {
    id: "service-land",
    category: "land",
    title: "Open Agricultural Farmland",
    alt: "Open agricultural farmland, cropland and rural green fields under an evening sky",
    caption: "Regional property listings: residential and commercial estate plots in Northern Nigeria.",
    description: "Expansive rural agricultural fields and green open landscape under sunset lighting.",
    src: "/images/service-land.webp",
    srcSet: "/images/service-land-600.webp 600w, /images/service-land.webp 1200w",
    width: 600,
    height: 338,
    aspectRatio: "16/9",
    type: "licensed_stock_photo",
    provenance: {
      origin: "Pexels stock photography",
      license: "Pexels Free Commercial License",
      licenseUrl: "https://www.pexels.com/license/",
    },
    attribution: "Regional landscape illustrative photography. Estate plot documentation and coordinates provided during physical site visits.",
    replacementNotes: "Replace with survey photography or on-site plot demarcation photos from Millennium City or Danbushiya estate plots in Kaduna.",
  },

  training: {
    id: "service-training",
    category: "training",
    title: "Electrical Technician Servicing Meter Panel",
    alt: "An electrical technician wearing a reflective safety vest and protective gloves servicing an outdoor electrical panel",
    caption: "Practical technical skills: electrical installation fundamentals and distribution panel wiring.",
    description: "An electrical technician in safety gear wiring an outdoor electrical distribution and meter box.",
    src: "/images/service-training.webp",
    srcSet: "/images/service-training-600.webp 600w, /images/service-training.webp 1200w",
    width: 600,
    height: 338,
    aspectRatio: "16/9",
    type: "licensed_stock_photo",
    provenance: {
      origin: "Unsplash stock photography",
      license: "Unsplash Free Commercial License",
      licenseUrl: "https://unsplash.com/license",
    },
    attribution: "Technical skills category photograph. Training curricula and workshop schedules provided upon registration.",
    replacementNotes: "Replace with photographs of company technical workshop cohorts and instructor demonstrations in Kaduna.",
  },
} as const;

export type SiteImageKey = keyof typeof siteImages;
