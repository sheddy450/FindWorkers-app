import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/http";
import { clientIp } from "@/lib/security/rate-limit-rules";
import { requestPasswordReset } from "@/server/services/password-reset.service";

const body = z.object({ email: z.string().trim().email() });

/** Always answers the same way, whether or not the email is registered. */
export const POST = handle(async (req) => {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) throw new HttpError(422, "Enter the email address you registered with.");
  await requestPasswordReset(p.data.email, clientIp((n) => req.headers.get(n)));
  return NextResponse.json({ ok: true });
});
