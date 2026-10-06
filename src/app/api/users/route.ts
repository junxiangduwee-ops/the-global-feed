import { NextResponse }         from "next/server";
import { assertCapability }          from "@/lib/session";
import { canAssignRole, isSuperAdmin } from "@/lib/rbac";
import { prisma }               from "@/lib/prisma";
import { UserRole }             from "@prisma/client";
import bcrypt                   from "bcryptjs";
import { z }                    from "zod";

// ─── GET /api/users ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  let session;
  try {
    session = await assertCapability("users:view");
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q")?.trim() ?? "";
  const role     = searchParams.get("role")       ?? "";
  const active   = searchParams.get("active")     ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  // Build role filter — non-SA users never see SUPER_ADMIN accounts
  const hideSuperAdmin = !isSuperAdmin(session.role);
  const roleFilter = role
    ? { role: role as UserRole }
    : hideSuperAdmin
      ? { role: { not: "SUPER_ADMIN" as UserRole } }
      : {};

  const where = {
    ...(q ? {
      OR: [
        { name:  { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...roleFilter,
    ...(active ? { isActive: active === "true" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
        department: true, country: true, isActive: true, createdAt: true,
        _count: { select: { releases: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

// ─── POST /api/users ───────────────────────────────────────────────────────────

const CreateSchema = z.object({
  name:       z.string().min(2).max(100),
  email:      z.string().email(),
  password:   z.string().min(8).max(128),
  role:       z.nativeEnum(UserRole),
  department: z.string().max(100).optional(),
  country:    z.string().length(2).default("MY"),
});

export async function POST(req: Request) {
  let session;
  try {
    session = await assertCapability("users:create");
  } catch (e) {
    return e as Response;
  }

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const { name, email, password, role, department, country } = parsed.data;

  if (!canAssignRole(session.role, role))
    return NextResponse.json(
      { error: "Cannot assign a role equal to or above your own." },
      { status: 403 }
    );

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists)
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email:      email.toLowerCase(),
      password:   hash,
      role,
      department: department ?? null,
      country,
    },
    select: {
      id: true, name: true, email: true, role: true,
      department: true, country: true, isActive: true, createdAt: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.id,
      action:  "user.created",
      meta:    JSON.stringify({ targetId: user.id, role }),
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
