import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { formatRelative, countryFlag } from "@/lib/utils";
import { StatusBadge } from "@/components/releases/StatusBadge";
import { RELEASE_TYPE_LABELS, type ReleaseType } from "@/lib/types";

export const metadata = { title: "All Releases" };
const PAGE = 20;

export default async function ReleasesPage({ searchParams }: { searchParams: Record<string, string> }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const page   = parseInt(searchParams.page ?? "1");
  const offset = (page - 1) * PAGE;

  const where = {
    ...(searchParams.status   ? { status:          searchParams.status as any }       : {}),
    ...(searchParams.type     ? { releaseType:      searchParams.type as any }         : {}),
    ...(searchParams.language ? { originLanguage:   searchParams.language }            : {}),
    ...(searchParams.country  ? { originCountry:    searchParams.country }             : {}),
    ...(searchParams.q        ? { title: { contains: searchParams.q, mode: "insensitive" as any } } : {}),
  };

  const [releases, total] = await Promise.all([
    prisma.release.findMany({
      where, take: PAGE, skip: offset,
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { name: true } } },
    }),
    prisma.release.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f1f5f9]">All Releases</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{total} release{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/drafts/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={15} /> New draft
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3347] bg-[#1d2433]/40">
              {["Release", "Type", "Status", "Submitted by", "When"].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3347]/50">
            {releases.map((r) => (
              <tr key={r.id} className="table-row group">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/releases/${r.id}`}
                    className="font-medium text-[#f1f5f9] group-hover:text-indigo-300 transition-colors block">
                    {countryFlag(r.originCountry)} {r.title}
                  </Link>
                  {r.excerpt && <p className="text-[10px] text-[#64748b] mt-0.5 line-clamp-1 max-w-sm">{r.excerpt}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-[#64748b] hidden md:table-cell">
                  {RELEASE_TYPE_LABELS[r.releaseType as ReleaseType]}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-[#94a3b8] hidden lg:table-cell">{r.submittedBy.name}</td>
                <td className="px-4 py-3 text-xs text-[#64748b] hidden lg:table-cell text-right">{formatRelative(r.createdAt)}</td>
              </tr>
            ))}
            {!releases.length && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[#64748b] text-sm">No releases found.</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a3347] text-sm">
            <p className="text-xs text-[#64748b]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                  className="btn-secondary text-xs px-3 py-1.5">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                  className="btn-secondary text-xs px-3 py-1.5">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
