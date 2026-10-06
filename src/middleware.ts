import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: session gate + rough route protection.
 *
 * Fine-grained RBAC (canManageUsers, canApprove, etc.) is enforced inside
 * each API route handler and server component — the middleware only handles
 * the unauthenticated redirect so the UX is smooth.
 *
 * NOTE: The token is validated properly inside getSession() (server-side).
 * Here we only check for presence, not validity, because the Edge runtime
 * cannot run bcrypt or crypto.createHmac with the same module.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session      = request.cookies.get("gf_session")?.value;

  const isAuth   = pathname.startsWith("/auth");
  const isApi    = pathname.startsWith("/api");
  const isPublic = pathname === "/";

  if (!session && !isAuth && !isApi && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
