import { NextResponse } from "next/server";
import { loginWithPassword, createSession } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const user = await loginWithPassword(email, password);
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ ok: true, user });
}
