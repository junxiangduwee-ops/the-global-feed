"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutDashboard, FileText, PlusCircle, Languages, Settings, Users, Clock } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { canApprove, ROLE_LABELS, type UserRole } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

export function Sidebar({ session }: { session: SessionUser }) {
  const pathname = usePathname();

  const nav = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard",          label: "Dashboard",    icon: LayoutDashboard },
        { href: "/dashboard/releases", label: "All Releases", icon: FileText },
      ],
    },
    {
      label: "Work",
      items: [
        { href: "/dashboard/drafts/new", label: "New Draft",  icon: PlusCircle },
        { href: "/dashboard/drafts",     label: "My Drafts",  icon: FileText },
        ...(canApprove(session.role)
          ? [{ href: "/dashboard/approvals", label: "Approvals", icon: Clock }]
          : []),
      ],
    },
    {
      label: "Tools",
      items: [
        { href: "/dashboard/translations", label: "Translations", icon: Languages },
      ],
    },
    ...(canApprove(session.role)
      ? [{ label: "Admin", items: [
          { href: "/dashboard/users",    label: "Users",    icon: Users },
          { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ]}]
      : []),
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#2a3347] bg-[#161b27]">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#2a3347]">
        <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Globe size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-[#f1f5f9]">The Global Feed</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[#64748b]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link href={item.href}
                      className={cn("sidebar-link", active && "sidebar-link-active")}>
                      <Icon size={16} className="flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#2a3347]">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-semibold text-indigo-200 flex-shrink-0">
            {getInitials(session.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#f1f5f9] truncate">{session.name}</p>
            <p className="text-[10px] text-[#64748b] truncate">{ROLE_LABELS[session.role as UserRole]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
