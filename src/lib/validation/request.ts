import { z } from "zod";
export const requestSchema = z.object({
  categoryId: z.string().min(1, "Choose what the job is about"),
  description: z.string().trim().min(10, "Describe the job in a bit more detail").max(1000),
  address: z.string().trim().min(5, "Enter the address for the job").max(200),
  preferredAt: z.string().datetime().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  photoKeys: z.array(z.string()).max(5).default([]),
});
