import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { ROLE_LABELS, RELEASE_TYPE_LABELS, type UserRole, type ReleaseType } from "@/lib/types";
import { can } from "@/lib/rbac";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!can(session.role, "releases:approve")) redirect("/dashboard");

  const pending = await prisma.release.findMany({
    where:   { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { submittedBy: { select: { name: true, role: true, department: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">Approvals queue</h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          {pending.length} submission{pending.length !== 1 ? "s" : ""} awaiting your review
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="card p-16 text-center">
          <Clock size={32} className="text-[#64748b] mx-auto mb-3" />
          <p className="text-[#94a3b8] font-medium">All clear</p>
          <p className="text-sm text-[#64748b] mt-1">No submissions waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="card p-5 hover:border-indigo-700/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#64748b]">
                    <span>{RELEASE_TYPE_LABELS[r.releaseType as ReleaseType]}</span>
                    <span>·</span>
                    <span>{r.originCountry}</span>
                    <span>·</span>
                    <span>{r.originLanguage.toUpperCase()}</span>
                    <span>·</span>
                    <span className="text-yellow-400">Waiting {formatRelative(r.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-[#f1f5f9]">{r.title}</h3>
                  {r.excerpt && (
                    <p className="text-sm text-[#64748b] line-clamp-2">{r.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-[#64748b]">
                    <div className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center text-[10px] text-indigo-200">
                      {r.submittedBy.name[0]}
                    </div>
                    <span>
                      {r.submittedBy.name}
                      {" · "}{ROLE_LABELS[r.submittedBy.role as UserRole]}
                      {r.submittedBy.department && ` · ${r.submittedBy.department}`}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/releases/${r.id}`}
                  className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0">
                  Review <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
