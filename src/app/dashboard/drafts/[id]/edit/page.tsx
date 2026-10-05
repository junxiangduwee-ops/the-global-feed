import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DraftForm } from "@/components/drafts/DraftForm";

export const metadata = { title: "Edit Draft" };

export default async function EditDraftPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const release = await prisma.release.findUnique({ where: { id: params.id } });
  if (!release) notFound();
  if (release.submittedById !== session.id) redirect("/dashboard");
  if (!["DRAFT", "DECLINED"].includes(release.status)) redirect(`/dashboard/releases/${release.id}`);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">Edit draft</h1>
        {release.status === "DECLINED" && (
          <p className="text-sm text-red-400 mt-0.5">
            This release was declined. Update it and resubmit for review.
          </p>
        )}
      </div>
      <DraftForm
        session={session}
        initial={{
          id:             release.id,
          title:          release.title,
          body:           release.body,
          excerpt:        release.excerpt ?? "",
          releaseType:    release.releaseType,
          originLanguage: release.originLanguage,
          originCountry:  release.originCountry,
          tags:           release.tags,
        }}
      />
    </div>
  );
}
