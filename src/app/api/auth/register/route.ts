import { NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { LIMITS, clientIp, minutesFrom } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "@/server/services/rate-limit.service";

export async function POST(req: Request) {
  const limited = await hitLimit(LIMITS.registerPerIp, clientIp((n) => req.headers.get(n)));
  if (!limited.ok) {
    return NextResponse.json({ error: `Too many sign-ups from this network. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } });
  }
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { name, email, phone, password, role } = parsed.data;
  const clash = await db.user.findFirst({
    where: { OR: [{ phoneE164: phone }, ...(email ? [{ email }] : [])] }, select: { id: true },
  });
  // Generic message avoids revealing which identifier is registered.
  if (clash) return NextResponse.json({ error: "An account with these details already exists." }, { status: 409 });
  const user = await db.user.create({
    data: { name, email, phoneE164: phone, role, passwordHash: await hash(password) },
    select: { id: true, role: true },
  });
  // Phone is NOT marked verified until an SMS provider confirms an OTP.
  return NextResponse.json(user, { status: 201 });
}
