import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { sendPhoneCode } from "@/server/services/phone.service";

/** Texts a 6-digit verification code to the signed-in user's phone. */
export const POST = handle(async () => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  return NextResponse.json(await sendPhoneCode(user.id));
});
