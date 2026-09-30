import { z } from "zod";
export const messageSchema = z.object({ body: z.string().trim().min(1, "Write a message").max(2000) });
