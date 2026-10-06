import { NextResponse }         from "next/server";
import { assertCapability }     from "@/lib/session";
import { prisma }               from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await assertCapability("releases:approve");
  } catch (e) {
    return e as Response;
  }

  await prisma.release.update({
    where: { id: params.id, status: "PENDING" },
    data:  { status: "APPROVED", reviewedById: session.id, reviewedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { releaseId: params.id, actorId: session.id, action: "approved" },
  });
  return NextResponse.json({ ok: true });
}
