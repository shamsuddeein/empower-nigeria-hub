export const naira = (n: number | null | undefined) => {
  const val = n ?? 0;
  if (!Number.isFinite(val)) return "₦0";
  const hasKobo = Math.abs(val % 1) >= 0.005;
  return (
    "₦" +
    val.toLocaleString("en-NG", {
      minimumFractionDigits: hasKobo ? 2 : 0,
      maximumFractionDigits: hasKobo ? 2 : 0,
    })
  );
};

export const formatNaira = naira;

export const formatKobo = (kobo: number | null | undefined) => {
  const k = kobo ?? 0;
  return naira(k / 100);
};

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
