import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { confirmPhoneCode } from "@/server/services/phone.service";

/** Checks the code the user typed. */
export const POST = handle(async (req) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const body = await req.json().catch(() => null) as { code?: unknown } | null;
  if (typeof body?.code !== "string") throw new HttpError(422, "Enter the 6-digit code.");
  return NextResponse.json(await confirmPhoneCode(user.id, body.code));
});
