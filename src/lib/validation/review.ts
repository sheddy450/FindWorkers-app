import { z } from "zod";
export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  body: z.string().trim().max(800).optional(),
});
