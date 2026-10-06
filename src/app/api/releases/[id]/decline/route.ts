import { NextResponse }         from "next/server";
import { assertCapability }     from "@/lib/session";
import { prisma }               from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await assertCapability("releases:approve");
  } catch (e) {
    return e as Response;
  }

  const { note } = await req.json();
  if (!note?.trim())
    return NextResponse.json({ error: "Decline reason required" }, { status: 400 });

  await prisma.release.update({
    where: { id: params.id, status: "PENDING" },
    data:  { status: "DECLINED", reviewedById: session.id, reviewedAt: new Date(), reviewNote: note },
  });
  await prisma.activityLog.create({
    data: { releaseId: params.id, actorId: session.id, action: "declined", meta: JSON.stringify({ note }) },
  });
  return NextResponse.json({ ok: true });
}
