import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/types";

export const metadata = { title: "Translations" };

export default async function TranslationsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const translations = await prisma.releaseTranslation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { release: { select: { id: true, title: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Languages size={20} className="text-indigo-400" />
        <div>
          <h1 className="text-xl font-semibold text-[#f1f5f9]">Translations</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{translations.length} translation{translations.length !== 1 ? "s" : ""} processed</p>
        </div>
      </div>

      {translations.length === 0 ? (
        <div className="card p-16 text-center">
          <Languages size={32} className="text-[#64748b] mx-auto mb-3" />
          <p className="text-[#94a3b8] font-medium">No translations yet</p>
          <p className="text-sm text-[#64748b] mt-1">
            Translations appear here after an approved release is sent to n8n for processing.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3347]">
                {["Release", "Language", "Country", "Status", "Translated"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3347]/50">
              {translations.map((t) => (
                <tr key={t.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/releases/${t.release.id}`}
                      className="text-[#f1f5f9] hover:text-indigo-300 transition-colors line-clamp-1 font-medium">
                      {t.release.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#94a3b8]">
                    {LANGUAGES.find((l) => l.code === t.language)?.label ?? t.language}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#94a3b8]">{t.country}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      t.status === "COMPLETED"   ? "bg-emerald-950 text-emerald-400 border-emerald-800" :
                      t.status === "FAILED"      ? "bg-red-950 text-red-400 border-red-800" :
                      t.status === "IN_PROGRESS" ? "bg-yellow-950 text-yellow-400 border-yellow-800" :
                      "bg-[#1e293b] text-[#94a3b8] border-[#334155]"
                    }`}>
                      {t.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">
                    {t.translatedAt ? new Date(t.translatedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
