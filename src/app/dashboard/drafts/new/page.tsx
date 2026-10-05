import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DraftForm } from "@/components/drafts/DraftForm";

export const metadata = { title: "New Draft" };

export default async function NewDraftPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">New draft</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Write your release. Save as draft or submit for review.</p>
      </div>
      <DraftForm session={session} />
    </div>
  );
}
