import "server-only";
import { cookies } from "next/headers";
import { prisma }  from "./prisma";
import bcrypt      from "bcryptjs";
import crypto      from "crypto";
import { can, type Capability } from "./rbac";
import type { UserRole } from "./types";

const COOKIE  = "gf_session";
const TTL_MS  = 12 * 60 * 60 * 1000; // 12 hours
const SECRET  = process.env.SESSION_SECRET ?? "change-me-in-production-32chars!";

export type SessionUser = {
  id:         string;
  email:      string;
  name:       string;
  role:       string;
  department: string | null;
  country:    string;
};

// ─── Token helpers ─────────────────────────────────────────────────────────────
// Format:  base64url(payload) + "." + hmac-sha256(payload)
// Payload: JSON { sub, exp }

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function sign(userId: string, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

function verify(token: string): { sub: string; exp: number } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig)     return null;
    if (hmac(payload) !== sig) return null; // tamper check
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null; // expiry check
    return data;
  } catch {
    return null;
  }
}

// ─── Session lifecycle ─────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const expires = Date.now() + TTL_MS;
  const token   = sign(userId, expires);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/",
    expires:  new Date(expires),
    secure:   process.env.NODE_ENV === "production",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const data = verify(token);
  if (!data) return null;

  const user = await prisma.user.findUnique({
    where:  { id: data.sub, isActive: true },
    select: {
      id: true, email: true, name: true,
      role: true, department: true, country: true,
    },
  });

  return user ?? null;
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

// ─── RBAC helper ──────────────────────────────────────────────────────────────

/**
 * Assert the current session exists AND has the given capability.
 *
 * Usage in API route handlers:
 *   const session = await assertCapability("releases:approve");
 *   // if it throws, Next.js catches it as a Response and returns 401/403.
 *
 * Throws a Response (compatible with Next.js route error handling).
 */
export async function assertCapability(capability: Capability): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status:  401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!can(session.role as UserRole, capability)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status:  403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export async function loginWithPassword(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.isActive) return null;

  // password can be null for LDAP-only accounts; guard before comparing
  if (!user.password) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return {
    id:         user.id,
    email:      user.email,
    name:       user.name,
    role:       user.role,
    department: user.department,
    country:    user.country,
  };
}
