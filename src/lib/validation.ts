import { z } from "zod";

/** Returns local 11-digit format (e.g. 08031234567) or null if invalid. */
export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  let local = digits;
  if (/^\+?234/.test(digits)) local = "0" + digits.replace(/^\+?234/, "");
  return /^0[789][01]\d{8}$/.test(local) ? local : null;
}

export const ngPhone = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .refine((v) => normalizeNgPhone(v) !== null, "Enter a Nigerian number, for example 0803 123 4567 or +234 803 123 4567")
  .transform((v) => normalizeNgPhone(v)!);

export const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .optional()
  .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email or leave it empty");

export const NORTHERN_STATES = [
  "Kaduna", "Kano", "Katsina", "Jigawa", "Bauchi", "Gombe", "Yobe", "Borno", "Adamawa", "Taraba",
  "Sokoto", "Kebbi", "Zamfara", "Niger", "Kwara", "Kogi", "Benue", "Plateau", "Nasarawa", "Abuja FCT",
];

export const ALL_STATES = [
  ...NORTHERN_STATES,
  "Abia", "Akwa Ibom", "Anambra", "Bayelsa", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Imo", "Lagos", "Ogun", "Ondo", "Osun", "Oyo", "Rivers",
];

export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
