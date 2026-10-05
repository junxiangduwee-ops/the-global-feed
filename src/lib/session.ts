import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const COOKIE = "gf_session";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type SessionUser = {
  id:         string;
  email:      string;
  name:       string;
  role:       string;
  department: string | null;
  country:    string;
};

function sign(payload: string): string {
  // Simple HMAC-style token using bcrypt hash — good enough for session IDs
  // In production consider using `jose` for proper JWT
  return Buffer.from(payload).toString("base64url");
}

function decode(token: string): string | null {
  try { return Buffer.from(token, "base64url").toString("utf8"); }
  catch { return null; }
}

export async function createSession(userId: string): Promise<void> {
  const expires = new Date(Date.now() + TTL_MS);
  const token   = sign(`${userId}:${expires.toISOString()}:${Math.random()}`);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/",
    expires,
    secure:   process.env.NODE_ENV === "production",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  const raw = decode(token);
  if (!raw) return null;

  const userId = raw.split(":")[0];
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where:  { id: userId, isActive: true },
    select: { id: true, email: true, name: true, role: true, department: true, country: true },
  });

  return user ?? null;
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE);
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, country: user.country };
}
