import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { accountSchema } from "@/lib/validation/profile";

export const PATCH = handle(async (req) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const parsed = accountSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const email = parsed.data.email || undefined;
  if (email) {
    const clash = await db.user.findFirst({ where: { email, id: { not: user.id } }, select: { id: true } });
    if (clash) throw new HttpError(409, "That email is already in use by another account.");
  }
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, email: email ?? null } });
  return NextResponse.json({ ok: true });
});
