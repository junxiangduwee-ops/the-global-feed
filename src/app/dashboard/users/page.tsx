import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can, ROLE_LEVEL } from "@/lib/rbac";
import { ROLE_LABELS, COUNTRIES, type UserRole } from "@/lib/types";
import { UsersPageClient } from "@/components/users/UsersPageClient";

export const metadata = { title: "User Management" };

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!can(session.role, "users:view")) redirect("/dashboard");

  const q      = searchParams.q      ?? "";
  const role   = searchParams.role   ?? "";
  const active = searchParams.active ?? "";
  const page   = Math.max(1, parseInt(searchParams.page ?? "1"));

  const where = {
    ...(q ? {
      OR: [
        { name:  { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(role   ? { role: role as UserRole }        : {}),
    ...(active ? { isActive: active === "true" }   : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
        department: true, country: true, isActive: true, createdAt: true,
        _count: { select: { releases: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const roles      = Object.entries(ROLE_LABELS) as [UserRole, string][];

  // Only show roles the actor can assign (strictly below their own level)
  const actorLevel      = ROLE_LEVEL[session.role as UserRole];
  const assignableRoles = roles.filter(([r]) => ROLE_LEVEL[r] < actorLevel);

  return (
    <UsersPageClient
      users={users}
      total={total}
      page={page}
      totalPages={totalPages}
      searchParams={searchParams}
      roles={roles}
      sessionId={session.id}
      sessionRole={session.role}
      canCreate={can(session.role, "users:create")}
      assignableRoles={assignableRoles}
      countries={COUNTRIES}
    />
  );
}
