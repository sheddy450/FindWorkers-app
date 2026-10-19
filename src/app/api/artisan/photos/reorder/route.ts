import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { reorderPhotos } from "@/server/services/photos.service";

export const POST = handle(async (req) => {
  const user = await requireRole("ARTISAN");
  const b = await req.json().catch(() => null) as { ids?: unknown } | null;
  if (!Array.isArray(b?.ids) || !b.ids.every((x) => typeof x === "string")) throw new HttpError(422, "Invalid order.");
  await reorderPhotos(user.id, b.ids as string[]);
  return NextResponse.json({ ok: true });
});
