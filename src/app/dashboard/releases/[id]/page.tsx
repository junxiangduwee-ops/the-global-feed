import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils";
import { StatusBadge } from "@/components/releases/StatusBadge";
import { ApproveDeclineBar } from "@/components/releases/ApproveDeclineBar";
import { ROLE_LABELS, RELEASE_TYPE_LABELS, LANGUAGES, type UserRole, type ReleaseType } from "@/lib/types";
import { can } from "@/lib/rbac";

export default async function ReleaseDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const release = await prisma.release.findUnique({
    where:   { id: params.id },
    include: {
      submittedBy:  { select: { name: true, role: true, department: true } },
      reviewedBy:   { select: { name: true } },
      translations: true,
    },
  });
  if (!release) notFound();

  const langLabel = LANGUAGES.find((l) => l.code === release.originLanguage)?.label ?? release.originLanguage;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/releases"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8]">
        <ArrowLeft size={14} /> All releases
      </Link>

      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={release.status} />
              <span className="text-xs text-[#64748b]">{RELEASE_TYPE_LABELS[release.releaseType as ReleaseType]}</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#f1f5f9] leading-snug">{release.title}</h1>
            {release.excerpt && <p className="text-[#94a3b8]">{release.excerpt}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#2a3347] text-sm">
          {[
            { label: "Language", value: langLabel },
            { label: "Market",   value: release.originCountry },
            { label: "Submitted by", value: `${release.submittedBy.name}\n${ROLE_LABELS[release.submittedBy.role as UserRole]}` },
            { label: "Created",  value: `${formatDate(release.createdAt)}\n${formatRelative(release.createdAt)}` },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[10px] text-[#64748b] mb-1">{m.label}</p>
              {m.value.split("\n").map((v, i) => (
                <p key={i} className={i === 0 ? "text-[#94a3b8] font-medium" : "text-[10px] text-[#64748b]"}>{v}</p>
              ))}
            </div>
          ))}
        </div>

        {release.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {release.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-xs rounded-full border border-indigo-900">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {can(session.role, "releases:approve") && release.status === "PENDING" && (
        <ApproveDeclineBar releaseId={release.id} />
      )}

      {release.status === "DECLINED" && release.reviewNote && (
        <div className="card p-4 border-red-800/50 bg-red-950/20">
          <p className="text-xs font-semibold text-red-400 mb-1">Decline reason</p>
          <p className="text-sm text-[#94a3b8]">{release.reviewNote}</p>
          {release.reviewedBy && (
            <p className="text-[10px] text-[#64748b] mt-2">
              — {release.reviewedBy.name}, {formatRelative(release.reviewedAt!)}
            </p>
          )}
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[#64748b] mb-4">Content</h2>
        <div className="text-[#94a3b8] leading-relaxed whitespace-pre-wrap text-sm" style={{ maxWidth: "72ch" }}>
          {release.body}
        </div>
      </div>

      {release.translations.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[#64748b] mb-4">Translations ({release.translations.length})</h2>
          <div className="space-y-2">
            {release.translations.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2.5 bg-[#1d2433] rounded-md border border-[#2a3347]">
                <div>
                  <p className="text-sm font-medium text-[#f1f5f9]">{t.title}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">
                    {LANGUAGES.find((l) => l.code === t.language)?.label ?? t.language} · {t.country}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  t.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border-emerald-800" :
                  t.status === "FAILED"    ? "bg-red-950 text-red-400 border-red-800" :
                  "bg-yellow-950 text-yellow-400 border-yellow-800"}`}>
                  {t.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
