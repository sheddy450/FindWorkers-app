import { NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
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
// TODO(phase 5): add rate limiting (src/lib/auth/rate-limit.ts).
