import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { z } from "zod";

/**
 * POST /api/auth/register
 *
 * Public self-registration endpoint.
 * Only non-privileged roles (ASSISTANT_MANAGER, SENIOR_EXECUTIVE) may
 * self-register.  Privileged accounts must be created by an admin via
 * POST /api/users.
 *
 * This prevents anyone from registering themselves as HOD/Senior Manager.
 */

const SELF_REGISTER_ROLES: UserRole[] = [
  UserRole.ASSISTANT_MANAGER,
  UserRole.SENIOR_EXECUTIVE,
];

const Schema = z.object({
  name:       z.string().min(2).max(100),
  email:      z.string().email(),
  password:   z.string().min(8).max(128),
  role:       z.nativeEnum(UserRole).optional(),
  department: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const { name, email, password, role, department } = parsed.data;

  // Enforce self-registration role constraint
  const assignedRole = role ?? UserRole.SENIOR_EXECUTIVE;
  if (!SELF_REGISTER_ROLES.includes(assignedRole)) {
    return NextResponse.json(
      { error: "Privileged accounts must be created by an administrator." },
      { status: 403 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (exists)
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email:      email.toLowerCase().trim(),
      password:   hash,
      role:       assignedRole,
      department: department ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
