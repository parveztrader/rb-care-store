import { z } from "zod";

export const sellCategories = ["Washing Machine", "Refrigerator", "Air Conditioner", "Microwave", "Other appliance"] as const;
export const sellConditions = ["Working well", "Working with issues", "Not working"] as const;
export const sellSchema = z.object({
  category: z.enum(sellCategories),
  brand: z.string().trim().min(2).max(60),
  model: z.string().trim().min(2).max(100),
  capacity: z.string().trim().min(1).max(60),
  age: z.enum(["Less than 1 year", "1–3 years", "3–5 years", "5–8 years", "More than 8 years", "Not sure"]),
  condition: z.enum(sellConditions),
  description: z.string().trim().min(15, "Describe the condition and issues in at least 15 characters.").max(2000),
  repairs: z.string().trim().max(1000),
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(120),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
  publishConsent: z.boolean(),
  contactConsent: z.literal(true, { errorMap: () => ({ message: "Consent to contact you is required for team review." }) }),
});
export type SellInput = z.infer<typeof sellSchema>;
export const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["NEW", "QUOTED", "PUBLISHED", "CLOSED", "REJECTED"]),
  teamPrice: z.number().int().min(0).max(1000000),
  ownerNote: z.string().trim().max(2000),
}).refine(v => !["QUOTED", "PUBLISHED"].includes(v.status) || v.teamPrice > 0, "Enter the team-approved price before sending a rate or publishing.");
