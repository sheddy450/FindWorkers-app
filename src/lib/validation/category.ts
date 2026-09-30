import { z } from "zod";
const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const categorySchema = z.object({ name: z.string().trim().min(2, "Enter a name").max(60) });
export function toSlug(name: string) { return slugify(name); }
