/**
 * Canonical Taxonomy, Topics, and Product Categories
 *
 * Provides shared canonical identifiers, readable labels, and recognized aliases
 * to reconcile public submission forms, catalogue filtering, and admin modules.
 */

// ---------------------------------------------------------------------------
// Enquiry Topics
// ---------------------------------------------------------------------------

export interface TopicDefinition {
  id: string;
  label: string;
  publicFormValue: string;
  aliases: string[];
}

export const ENQUIRY_TOPICS: TopicDefinition[] = [
  {
    id: "solar",
    label: "Solar for Business",
    publicFormValue: "Solar for Business",
    aliases: [
      "solar for business",
      "solar",
      "solar systems",
      "business solar",
      "solar energy",
    ],
  },
  {
    id: "ev",
    label: "Electric Vehicles",
    publicFormValue: "Electric Vehicles",
    aliases: [
      "electric vehicles",
      "ev",
      "vehicles",
      "electric motorcycles and tricycles",
      "motorcycles",
      "tricycles",
    ],
  },
  {
    id: "gadgets",
    label: "Phones and Gadgets",
    publicFormValue: "Phones and Gadgets",
    aliases: [
      "phones and gadgets",
      "gadgets",
      "phones & gadgets",
      "phones",
      "phone",
      "smartphones",
      "devices",
    ],
  },
  {
    id: "land",
    label: "Land and Estate",
    publicFormValue: "Land and Estate",
    aliases: [
      "land and estate",
      "land & estate",
      "land",
      "estate",
      "plots",
      "land & plots",
    ],
  },
  {
    id: "training",
    label: "Financial Services & Training",
    publicFormValue: "Financial Services & Training",
    aliases: [
      "financial services & training",
      "financial services and training",
      "training",
      "financial services",
      "vocational training",
    ],
  },
  {
    id: "agent",
    label: "Agent Partnership",
    publicFormValue: "Agent Partnership",
    aliases: [
      "agent partnership",
      "agent",
      "ambassador",
      "agent & ambassador",
      "partnership",
      "agents",
    ],
  },
];

/**
 * Normalizes any topic string or alias to its canonical topic definition.
 */
export function findTopicDefinition(topicStr?: string | null): TopicDefinition | undefined {
  if (!topicStr) return undefined;
  const clean = topicStr.trim().toLowerCase();
  return ENQUIRY_TOPICS.find(
    (t) =>
      t.id.toLowerCase() === clean ||
      t.label.toLowerCase() === clean ||
      t.publicFormValue.toLowerCase() === clean ||
      t.aliases.some((a) => a.toLowerCase() === clean)
  );
}

/**
 * Normalizes any topic string or alias into its canonical ID (e.g. "solar", "ev").
 */
export function normalizeTopicId(topicStr?: string | null): string {
  const def = findTopicDefinition(topicStr);
  return def ? def.id : (topicStr?.trim().toLowerCase() ?? "general");
}

/**
 * Returns all recognized alias strings for a given topic or filter key,
 * including historical and public form strings.
 */
export function getTopicAliases(topicKey?: string | null): string[] {
  if (!topicKey || topicKey === "all") return [];
  const def = findTopicDefinition(topicKey);
  if (!def) return [topicKey];
  return Array.from(new Set([def.id, def.label, def.publicFormValue, ...def.aliases]));
}

/**
 * Determines whether a message topic matches a given filter topic.
 */
export function matchesEnquiryTopic(messageTopic: string, filterTopic: string): boolean {
  if (!filterTopic || filterTopic === "all") return true;
  const filterDef = findTopicDefinition(filterTopic);
  const messageDef = findTopicDefinition(messageTopic);
  if (filterDef && messageDef) {
    return filterDef.id === messageDef.id;
  }
  return messageTopic.trim().toLowerCase() === filterTopic.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Product Categories
// ---------------------------------------------------------------------------

export interface ProductCategoryDefinition {
  id: string;
  label: string;
  aliases: string[];
}

export const PRODUCT_CATEGORIES: ProductCategoryDefinition[] = [
  {
    id: "solar",
    label: "Solar Systems",
    aliases: ["solar", "solar_systems", "solar systems", "solar hardware"],
  },
  {
    id: "ev",
    label: "Electric Vehicles",
    aliases: ["ev", "electric_vehicles", "electric vehicles", "vehicles"],
  },
  {
    id: "phones",
    label: "Phones & Smartphones",
    aliases: ["phones", "phone", "smartphones", "smartphone", "mobile"],
  },
  {
    id: "laptops",
    label: "Laptops & Computers",
    aliases: ["laptops", "laptop", "computers", "computer"],
  },
  {
    id: "tablets",
    label: "Tablets",
    aliases: ["tablets", "tablet", "ipad"],
  },
  {
    id: "power_banks",
    label: "Power Banks",
    aliases: ["power_banks", "power-bank", "power_bank", "powerbanks", "powerbank"],
  },
  {
    id: "accessories",
    label: "Accessories & Gadgets",
    aliases: ["accessories", "accessory", "gadgets", "gadget", "pos"],
  },
];

/**
 * Normalizes any product category alias into its canonical ID (e.g. "phone" -> "phones").
 */
export function normalizeProductCategory(categoryStr?: string | null): string {
  if (!categoryStr) return "solar";
  const clean = categoryStr.trim().toLowerCase();
  const match = PRODUCT_CATEGORIES.find(
    (c) => c.id.toLowerCase() === clean || c.aliases.some((a) => a.toLowerCase() === clean)
  );
  return match ? match.id : clean;
}

/**
 * Returns true if the product category matches the requested filter.
 */
export function matchesProductCategory(productCategory: string, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === "all") return true;
  return normalizeProductCategory(productCategory) === normalizeProductCategory(filterCategory);
}
