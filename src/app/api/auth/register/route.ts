import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  const { name, email, password, role, department } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password too short" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email:      email.toLowerCase().trim(),
      password:   hash,
      role:       (role as UserRole) || UserRole.SENIOR_EXECUTIVE,
      department: department || null,
    },
  });

  return NextResponse.json({ ok: true });
}
