import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/http";
import { passwordField } from "@/lib/validation/auth";
import { clientIp } from "@/lib/security/rate-limit-rules";
import { resetPassword } from "@/server/services/password-reset.service";

// Same password rules as sign-up.
const body = z.object({ token: z.string(), password: passwordField });

export const POST = handle(async (req) => {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ errors: p.error.flatten().fieldErrors }, { status: 422 });
  await resetPassword(p.data.token, p.data.password, clientIp((n) => req.headers.get(n)));
  return NextResponse.json({ ok: true });
});
