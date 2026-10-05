import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canApprove } from "@/lib/types";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canApprove(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.release.update({
    where: { id: params.id, status: "PENDING" },
    data:  { status: "APPROVED", reviewedById: session.id, reviewedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { releaseId: params.id, actorId: session.id, action: "approved" },
  });
  return NextResponse.json({ ok: true });
}
