import { z } from "zod";
import { PASSWORD_MAX, passwordProblem } from "./password";

/** Same rule wherever a password is set (sign-up, change, reset). */
export const passwordField = z.string().max(PASSWORD_MAX).superRefine((v, ctx) => {
  const problem = passwordProblem(v);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

/** Normalise Nigerian numbers (0803..., 803..., +234803...) to E.164. */
export function toE164NG(raw: string): string | null {
  const d = raw.replace(/[\s()-]/g, "");
  const m = d.match(/^(?:\+?234|0)?([789][01]\d{8})$/);
  return m ? `+234${m[1]}` : null;
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address, e.g. name@gmail.com").optional(),
  phone: z.string().transform((v, ctx) => {
    const p = toE164NG(v);
    if (!p) ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
    return p as string;
  }),
  password: passwordField,
  // Admin can never be self-registered.
  role: z.enum(["CUSTOMER", "ARTISAN"]),
}).superRefine((v, ctx) => {
  // Artisans need an email: it's how they reset a forgotten password and get Pro payment receipts.
  if (v.role === "ARTISAN" && !v.email)
    ctx.addIssue({ code: "custom", path: ["email"], message: "Enter your email. You'll need it to reset your password and to pay for Pro." });
  // Also refuse the person's own phone number as their password.
  const problem = v.phone ? passwordProblem(v.password, v.phone) : null;
  if (problem) ctx.addIssue({ code: "custom", path: ["password"], message: problem });
});
export const loginSchema = z.object({ identifier: z.string().min(3), password: z.string().min(1) });
export type RegisterInput = z.infer<typeof registerSchema>;
