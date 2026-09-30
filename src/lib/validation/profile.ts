import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").optional().or(z.literal("")),
});
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(10, "Use at least 10 characters").max(128),
});
