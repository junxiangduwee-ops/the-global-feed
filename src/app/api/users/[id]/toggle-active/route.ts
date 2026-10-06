import { NextResponse }     from "next/server";
import { assertCapability } from "@/lib/session";
import { canToggleUser }    from "@/lib/rbac";
import { prisma }           from "@/lib/prisma";
import { UserRole }         from "@prisma/client";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  let session;
  try {
    session = await assertCapability("users:manage");
  } catch (e) {
    return e as Response;
  }

  if (session.id === params.id)
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canToggleUser(session.role, target.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Guard: cannot deactivate the last HOD
  const { active } = (await req.json()) as { active: boolean };
  if (!active && target.role === "HEAD_OF_DEPARTMENT") {
    const hodCount = await prisma.user.count({
      where: { role: "HEAD_OF_DEPARTMENT", isActive: true },
    });
    if (hodCount <= 1)
      return NextResponse.json(
        { error: "Cannot deactivate the only Head of Department." },
        { status: 400 }
      );
  }

  const updated = await prisma.user.update({
    where:  { id: params.id },
    data:   { isActive: active },
    select: { id: true, name: true, isActive: true },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.id,
      action:  active ? "user.activated" : "user.deactivated",
      meta:    JSON.stringify({ targetId: params.id }),
    },
  });

  return NextResponse.json({ user: updated });
}
