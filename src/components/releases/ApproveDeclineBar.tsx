"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ApproveDeclineBar({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const [loading,  setLoading]  = useState<"approve" | "decline" | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note,     setNote]     = useState("");

  async function handle(action: "approve" | "decline") {
    if (action === "decline" && !showNote) { setShowNote(true); return; }
    if (action === "decline" && !note.trim()) { toast.error("Please provide a decline reason"); return; }
    setLoading(action);
    const res  = await fetch(`/api/releases/${releaseId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "decline" ? JSON.stringify({ note }) : undefined,
    });
    const json = await res.json();
    if (!res.ok) toast.error(json.error ?? "Failed");
    else { toast.success(action === "approve" ? "Release approved" : "Release declined"); router.refresh(); }
    setLoading(null);
  }

  return (
    <div className="card p-4 border-yellow-800/40 bg-yellow-950/10">
      <p className="text-sm font-medium text-[#f1f5f9] mb-3">This release is awaiting your review</p>
      {!showNote ? (
        <div className="flex gap-2">
          <button onClick={() => handle("approve")} disabled={!!loading}
            className="btn-primary flex items-center gap-2 text-sm bg-emerald-700 hover:bg-emerald-600">
            {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve
          </button>
          <button onClick={() => handle("decline")} disabled={!!loading} className="btn-danger flex items-center gap-2 text-sm">
            <XCircle size={14} /> Decline
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="label">Reason for declining</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Explain why this release is being declined…"
            value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => handle("decline")} disabled={!!loading}
              className="btn-danger flex items-center gap-2 text-sm">
              {loading === "decline" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Confirm decline
            </button>
            <button onClick={() => setShowNote(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
