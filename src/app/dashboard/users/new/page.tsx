import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can, ROLE_LEVEL } from "@/lib/rbac";
import { ROLE_LABELS, COUNTRIES, type UserRole } from "@/lib/types";
import { UserForm } from "@/components/users/UserForm";

export const metadata = { title: "Add User" };

export default async function NewUserPage() {
  const session = await getSession();
  if (!session)               redirect("/auth/login");
  if (!can(session.role, "users:create")) redirect("/dashboard/users");

  // Only show roles the actor can assign (strictly below their level)
  const actorLevel    = ROLE_LEVEL[session.role as UserRole];
  const assignableRoles = (Object.entries(ROLE_LABELS) as [UserRole, string][]).filter(
    ([role]) => ROLE_LEVEL[role] < actorLevel
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">Add user</h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          Create a new account. The user can change their password after signing in.
        </p>
      </div>
      <UserForm
        mode="create"
        assignableRoles={assignableRoles}
        countries={COUNTRIES}
        backHref="/dashboard/users"
      />
    </div>
  );
}
