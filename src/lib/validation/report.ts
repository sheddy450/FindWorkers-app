import { z } from "zod";
export const reportSchema = z.object({
  targetType: z.enum(["USER", "REVIEW", "ARTISAN"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(10, "Give a bit more detail so we can look into this").max(1000),
});
