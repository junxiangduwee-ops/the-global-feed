"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import { canEditUser, canToggleUser } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

type User = {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  department: string | null;
  country:    string;
  isActive:   boolean;
  createdAt:  Date | string;
  _count:     { releases: number };
};

interface Props {
  users:       User[];
  sessionId:   string;
  sessionRole: string;
}

export function UserTable({ users, sessionId, sessionRole }: Props) {
  const router             = useRouter();
  const [pending, start]   = useTransition();
  const [openMenu, setMenu] = useState<string | null>(null);

  async function toggleActive(userId: string, currentlyActive: boolean) {
    setMenu(null);
    const res = await fetch(`/api/users/${userId}/toggle-active`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: !currentlyActive }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast.error(j.error ?? "Failed to update user");
    } else {
      toast.success(currentlyActive ? "User deactivated" : "User activated");
      start(() => router.refresh());
    }
  }

  if (!users.length) {
    return (
      <div className="card p-16 text-center text-[#64748b] text-sm">
        No users found matching your filters.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden relative">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a3347] bg-[#1d2433]/40">
            {["User", "Role", "Department", "Releases", "Status", "Joined", ""].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a3347]/50">
          {users.map((u) => {
            const canEdit   = sessionId === u.id || canEditUser(sessionRole as UserRole, u.role as UserRole);
            const canToggle = sessionId !== u.id  && canToggleUser(sessionRole as UserRole, u.role as UserRole);
            const isSelf    = sessionId === u.id;

            return (
              <tr key={u.id} className="table-row group">
                {/* Name + email */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-semibold text-indigo-200 flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#f1f5f9] truncate">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] text-indigo-400 font-normal">(you)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#64748b] truncate">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-3 text-xs text-[#94a3b8]">
                  {ROLE_LABELS[u.role as UserRole] ?? u.role}
                </td>

                {/* Department */}
                <td className="px-4 py-3 text-xs text-[#64748b] hidden md:table-cell">
                  {u.department ?? <span className="italic opacity-50">—</span>}
                </td>

                {/* Releases count */}
                <td className="px-4 py-3 text-xs text-[#64748b] hidden lg:table-cell">
                  {u._count.releases}
                </td>

                {/* Active badge */}
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      u.isActive
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : "bg-[#1e293b] text-[#64748b] border-[#334155]"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-4 py-3 text-xs text-[#64748b] hidden lg:table-cell">
                  {formatDate(u.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  {(canEdit || canToggle) && (
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenu(openMenu === u.id ? null : u.id)}
                        className="btn-ghost p-1.5 text-[#64748b] hover:text-[#94a3b8]"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenu === u.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenu(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 min-w-[160px] bg-[#1d2433] border border-[#2a3347] rounded-lg shadow-xl py-1 text-sm">
                            {canEdit && (
                              <Link
                                href={`/dashboard/users/${u.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-[#f1f5f9] hover:bg-[#2a3347] transition-colors"
                                onClick={() => setMenu(null)}
                              >
                                <Pencil size={13} /> Edit
                              </Link>
                            )}
                            {canToggle && (
                              <button
                                onClick={() => toggleActive(u.id, u.isActive)}
                                className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${
                                  u.isActive
                                    ? "text-red-400 hover:bg-red-950/30"
                                    : "text-emerald-400 hover:bg-emerald-950/30"
                                }`}
                              >
                                {u.isActive ? <PowerOff size={13} /> : <Power size={13} />}
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
