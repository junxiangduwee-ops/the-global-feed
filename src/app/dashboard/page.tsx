import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, CheckCircle, Globe, PlusCircle, ArrowRight } from "lucide-react";
import { formatRelative, countryFlag } from "@/lib/utils";
import { StatusBadge } from "@/components/releases/StatusBadge";
import { canApprove, ROLE_LABELS, type UserRole, RELEASE_TYPE_LABELS, type ReleaseType } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [total, pending, published, mine, recent] = await Promise.all([
    prisma.release.count(),
    prisma.release.count({ where: { status: "PENDING" } }),
    prisma.release.count({ where: { status: "PUBLISHED" } }),
    prisma.release.count({ where: { submittedById: session.id } }),
    prisma.release.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Releases",  value: total,     icon: FileText,    color: "text-indigo-400" },
    { label: "Pending Review",  value: pending,   icon: Clock,       color: "text-yellow-400" },
    { label: "Published",       value: published, icon: CheckCircle, color: "text-emerald-400" },
    { label: "My Submissions",  value: mine,      icon: Globe,       color: "text-sky-400" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">
            Good {greeting}, <span className="text-indigo-400">{session.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {ROLE_LABELS[session.role as UserRole]} · {session.department ?? "Communications"}
          </p>
        </div>
        <Link href="/dashboard/drafts/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={15} /> New draft
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#64748b] font-medium">{s.label}</span>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-3xl font-semibold text-[#f1f5f9]">{s.value}</p>
            </div>
          );
        })}
      </div>

      {canApprove(session.role) && pending > 0 && (
        <div className="card p-4 border-yellow-800/50 bg-yellow-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#f1f5f9]">
                {pending} submission{pending > 1 ? "s" : ""} awaiting your review
              </p>
              <p className="text-xs text-[#64748b]">Approve or decline to move them forward</p>
            </div>
          </div>
          <Link href="/dashboard/approvals" className="btn-secondary text-sm flex items-center gap-1">
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-[#f1f5f9]">Recent activity</h2>
          <Link href="/dashboard/releases" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            All releases <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3347]">
                {["Release", "Type", "Status", "Submitted by", "When"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/releases/${r.id}`}
                      className="font-medium text-[#f1f5f9] hover:text-indigo-300 transition-colors line-clamp-1">
                      {countryFlag(r.originCountry)} {r.title}
                    </Link>
                    {r.excerpt && <p className="text-[10px] text-[#64748b] mt-0.5 line-clamp-1">{r.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748b] hidden md:table-cell">
                    {RELEASE_TYPE_LABELS[r.releaseType as ReleaseType]}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-[#94a3b8] hidden lg:table-cell">{r.submittedBy.name}</td>
                  <td className="px-4 py-3 text-xs text-[#64748b] hidden lg:table-cell">{formatRelative(r.createdAt)}</td>
                </tr>
              ))}
              {!recent.length && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[#64748b] text-sm">
                  No releases yet.{" "}
                  <Link href="/dashboard/drafts/new" className="text-indigo-400 hover:text-indigo-300">
                    Create your first draft →
                  </Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
