import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { FieldErrors, createJob } from "@/server/services/jobs.service";
import { sendMetaEvent } from "@/server/services/meta-capi.service";

/** Post a job (customers). Field problems come back as { errors: { field: message } }. */
export const POST = handle(async (req) => {
  const user = await requireRole("CUSTOMER");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const job = await createJob(user.id, body ?? {});
    sendMetaEvent(req, { name: "Lead", user: { id: user.id, phone: user.phoneE164 }, customData: { content_name: "job_post" } });
    return NextResponse.json(job, { status: 201 });
  } catch (e) {
    if (e instanceof FieldErrors) return NextResponse.json({ errors: e.errors }, { status: 422 });
    throw e;
  }
});
