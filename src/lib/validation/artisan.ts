import { z } from "zod";
export const NIGERIA_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT (Abuja)","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"] as const;

export const profileSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your name or business name").max(80),
  bio: z.string().trim().max(600, "Keep this under 600 characters").optional(),
  yearsExperience: z.number().int().min(0).max(60),
  categoryIds: z.array(z.string()).min(1, "Choose at least one service").max(5, "Choose up to 5 services"),
  state: z.enum(NIGERIA_STATES, { errorMap: () => ({ message: "Choose your state" }) }),
  lga: z.string().trim().min(2, "Enter your area or LGA").max(60),
  serviceRadiusKm: z.number().int().min(1).max(100),
  priceMinNaira: z.number().int().min(0).max(10_000_000).optional(),
  priceMaxNaira: z.number().int().min(0).max(10_000_000).optional(),
  availability: z.enum(["AVAILABLE_NOW", "BY_SCHEDULE", "UNAVAILABLE"]),
  // Optional precise location; only sent if the person taps "Use my current location".
  lat: z.number().min(3.5).max(14.5).optional(),
  lng: z.number().min(2.5).max(15).optional(),
}).refine((v) => v.priceMinNaira == null || v.priceMaxNaira == null || v.priceMinNaira <= v.priceMaxNaira,
  { path: ["priceMaxNaira"], message: "Highest price must be at least the starting price" })
  .refine((v) => (v.lat == null) === (v.lng == null), { path: ["lat"], message: "Location is incomplete" });
export type ProfileInput = z.infer<typeof profileSchema>;
