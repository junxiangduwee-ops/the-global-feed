import { NextResponse }         from "next/server";
import { assertCapability, getSession } from "@/lib/session";
import { canEditUser, canAssignRole }   from "@/lib/rbac";
import { prisma }               from "@/lib/prisma";
import { UserRole }             from "@prisma/client";
import bcrypt                   from "bcryptjs";
import { z }                    from "zod";

type Params = { params: { id: string } };

// ─── GET /api/users/[id] ──────────────────────────────────────────────────────

export async function GET(_: Request, { params }: Params) {
  let session;
  try {
    session = await assertCapability("users:view");
  } catch (e) {
    return e as Response;
  }

  const user = await prisma.user.findUnique({
    where:  { id: params.id },
    select: {
      id: true, name: true, email: true, role: true,
      department: true, country: true, isActive: true,
      createdAt: true, updatedAt: true,
      _count: { select: { releases: true, reviews: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// ─── PATCH /api/users/[id] ────────────────────────────────────────────────────

const PatchSchema = z.object({
  name:       z.string().min(2).max(100).optional(),
  role:       z.nativeEnum(UserRole).optional(),
  department: z.string().max(100).nullable().optional(),
  country:    z.string().length(2).optional(),
  isActive:   z.boolean().optional(),
  password:   z.string().min(8).max(128).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  // Self-edit doesn't need users:manage; any authenticated user can update
  // their own name/department/password. Full edit requires users:manage.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSelf = session.id === params.id;

  if (!isSelf && !canEditUser(session.role, target.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body   = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const { name, role, department, country, isActive, password } = parsed.data;

  // Guard: cannot assign role equal to or above actor's own level
  if (role && !isSelf && !canAssignRole(session.role, role))
    return NextResponse.json(
      { error: "Cannot assign a role equal to or above your own." },
      { status: 403 }
    );

  // Guard: cannot self-deactivate
  if (isSelf && isActive === false)
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });

  // Guard: cannot demote the last HOD
  if (role && role !== "HEAD_OF_DEPARTMENT" && target.role === "HEAD_OF_DEPARTMENT") {
    const hodCount = await prisma.user.count({
      where: { role: "HEAD_OF_DEPARTMENT", isActive: true },
    });
    if (hodCount <= 1)
      return NextResponse.json(
        { error: "Cannot demote the only Head of Department. Promote another user first." },
        { status: 400 }
      );
  }

  const data: Record<string, unknown> = {};
  if (name       !== undefined) data.name       = name;
  if (role       !== undefined) data.role       = role;
  if (department !== undefined) data.department = department;
  if (country    !== undefined) data.country    = country;
  if (isActive   !== undefined) data.isActive   = isActive;
  if (password)                 data.password   = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where:  { id: params.id },
    data,
    select: {
      id: true, name: true, email: true, role: true,
      department: true, country: true, isActive: true, updatedAt: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.id,
      action:  "user.updated",
      meta:    JSON.stringify({ targetId: params.id, fields: Object.keys(data) }),
    },
  });

  return NextResponse.json({ user: updated });
}

// ─── DELETE /api/users/[id] ───────────────────────────────────────────────────
// Hard delete is disabled; deactivate via PATCH { isActive: false } instead.

export async function DELETE() {
  return NextResponse.json(
    { error: "Hard delete is disabled. Use PATCH { isActive: false } to deactivate." },
    { status: 405 }
  );
}
