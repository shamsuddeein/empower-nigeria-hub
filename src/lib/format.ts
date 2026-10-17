export const naira = (n: number | null | undefined) => "₦" + Math.round(n ?? 0).toLocaleString("en-NG");

export const CATEGORY_LABELS: Record<string, string> = {
  solar: "Solar",
  ev: "Electric vehicle",
  phones: "Phones",
  laptops: "Laptops",
  tablets: "Tablets",
  accessories: "Accessories",
  power_banks: "Power banks",
  others: "Others",
};

export const GADGET_CATEGORIES = ["phones", "laptops", "tablets", "accessories", "power_banks", "others"];

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}
