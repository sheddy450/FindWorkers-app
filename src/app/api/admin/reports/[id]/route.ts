import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";

const body = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  note: z.string().max(500).optional(),
});

export const POST = handle(
  async (req, { params }: { params: { id: string } }) => {
    const admin = await requireRole("ADMIN");
    const p = body.safeParse(await req.json().catch(() => null));
    if (!p.success) throw new HttpError(422, "Invalid decision.");
    const report = await db.report.findUnique({ where: { id: params.id } });
    if (!report) throw new HttpError(404, "Report not found.");
    if (report.status !== "OPEN")
      throw new HttpError(409, "This report was already resolved.");

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const res = await tx.report.updateMany({
        where: { id: params.id, status: "OPEN" },
        data: {
          status: p.data.status,
          resolvedBy: admin.id,
          resolvedAt: new Date(),
          resolutionNote: p.data.note ?? null,
        },
      });
      if (res.count !== 1)
        throw new HttpError(409, "This report was already resolved.");
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: `report.${p.data.status.toLowerCase()}`,
          entity: "Report",
          entityId: report.id,
        },
      });
    });
    return NextResponse.json({ ok: true });
  },
);
