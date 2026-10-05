import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canApprove } from "@/lib/types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canApprove(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { note } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "Decline reason required" }, { status: 400 });

  await prisma.release.update({
    where: { id: params.id, status: "PENDING" },
    data:  { status: "DECLINED", reviewedById: session.id, reviewedAt: new Date(), reviewNote: note },
  });
  await prisma.activityLog.create({
    data: { releaseId: params.id, actorId: session.id, action: "declined", meta: JSON.stringify({ note }) },
  });
  return NextResponse.json({ ok: true });
}
