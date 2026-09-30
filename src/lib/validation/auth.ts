import { z } from "zod";

/** Normalise Nigerian numbers (0803..., 803..., +234803...) to E.164. */
export function toE164NG(raw: string): string | null {
  const d = raw.replace(/[\s()-]/g, "");
  const m = d.match(/^(?:\+?234|0)?([789][01]\d{8})$/);
  return m ? `+234${m[1]}` : null;
}

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().transform((v, ctx) => {
    const p = toE164NG(v);
    if (!p) ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
    return p as string;
  }),
  password: z.string().min(10, "Use at least 10 characters").max(128),
  // Admin can never be self-registered.
  role: z.enum(["CUSTOMER", "ARTISAN"]),
});
export const loginSchema = z.object({ identifier: z.string().min(3), password: z.string().min(1) });
export type RegisterInput = z.infer<typeof registerSchema>;
