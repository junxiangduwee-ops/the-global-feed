import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canEditUser, can, ROLE_LEVEL } from "@/lib/rbac";
import { ROLE_LABELS, COUNTRIES, type UserRole } from "@/lib/types";
import { UserForm } from "@/components/users/UserForm";

export const metadata = { title: "Edit User" };

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const isSelf = session.id === params.id;

  // Non-admin users can only view/edit themselves
  if (!isSelf && !can(session.role, "users:view")) redirect("/dashboard");

  const target = await prisma.user.findUnique({
    where:  { id: params.id },
    select: {
      id: true, name: true, email: true, role: true,
      department: true, country: true, isActive: true,
      _count: { select: { releases: true, reviews: true } },
    },
  });
  if (!target) notFound();

  if (!isSelf && !canEditUser(session.role as UserRole, target.role as UserRole)) {
    redirect("/dashboard/users");
  }

  // Determine which roles the actor can assign (they can always keep same role on self-edit)
  const actorLevel = ROLE_LEVEL[session.role as UserRole];
  const assignableRoles = (Object.entries(ROLE_LABELS) as [UserRole, string][]).filter(
    ([role]) => isSelf
      ? role === target.role                         // self: can't change own role
      : ROLE_LEVEL[role] < actorLevel               // admin: strictly below actor level
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">
          {isSelf ? "My profile" : `Edit — ${target.name}`}
        </h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          {target._count.releases} release{target._count.releases !== 1 ? "s" : ""} submitted
          {target._count.reviews > 0 && ` · ${target._count.reviews} reviews`}
        </p>
      </div>
      <UserForm
        mode="edit"
        user={target}
        assignableRoles={assignableRoles}
        countries={COUNTRIES}
        isSelf={isSelf}
        isAdmin={!isSelf && can(session.role, "users:manage")}
        backHref={isSelf ? "/dashboard" : "/dashboard/users"}
      />
    </div>
  );
}
