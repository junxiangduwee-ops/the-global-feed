import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { StatusBadge } from "@/components/releases/StatusBadge";
import { RELEASE_TYPE_LABELS, type ReleaseType } from "@/lib/types";

export const metadata = { title: "My Drafts" };

export default async function MyDraftsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const drafts = await prisma.release.findMany({
    where:   { submittedById: session.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f1f5f9]">My Drafts</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{drafts.length} submission{drafts.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/drafts/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={15} /> New draft
        </Link>
      </div>

      <div className="grid gap-3">
        {drafts.map((r) => (
          <div key={r.id} className="card p-4 flex items-start gap-4 hover:border-[#374151] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={r.status} />
                <span className="text-[10px] text-[#64748b] capitalize">
                  {RELEASE_TYPE_LABELS[r.releaseType as ReleaseType]}
                </span>
                <span className="text-[10px] text-[#64748b]">· {r.originCountry}</span>
              </div>
              <Link href={`/dashboard/releases/${r.id}`}
                className="font-medium text-[#f1f5f9] hover:text-indigo-300 transition-colors">
                {r.title}
              </Link>
              {r.excerpt && <p className="text-sm text-[#64748b] mt-0.5 line-clamp-1">{r.excerpt}</p>}
              <p className="text-[10px] text-[#64748b] mt-2">Updated {formatRelative(r.updatedAt)}</p>
            </div>
            {["DRAFT", "DECLINED"].includes(r.status) && (
              <Link href={`/dashboard/drafts/${r.id}/edit`}
                className="btn-ghost p-2 text-[#64748b] flex-shrink-0" title="Edit">
                <Pencil size={15} />
              </Link>
            )}
          </div>
        ))}

        {!drafts.length && (
          <div className="card p-12 text-center">
            <p className="text-[#64748b] text-sm mb-3">You haven't submitted anything yet.</p>
            <Link href="/dashboard/drafts/new" className="btn-primary inline-flex items-center gap-2 text-sm">
              <PlusCircle size={15} /> Write your first release
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
