"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Send, Loader2, Tag, X } from "lucide-react";
import { canPublishDirectly, LANGUAGES, COUNTRIES, RELEASE_TYPE_LABELS } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

const TYPES = Object.entries(RELEASE_TYPE_LABELS);

interface Props {
  session: SessionUser;
  initial?: {
    id: string; title: string; body: string; excerpt: string;
    releaseType: string; originLanguage: string; originCountry: string; tags: string[];
  };
}

export function DraftForm({ session, initial }: Props) {
  const router  = useRouter();
  const isEdit  = Boolean(initial?.id);

  const [title,      setTitle]      = useState(initial?.title           ?? "");
  const [body,       setBody]       = useState(initial?.body            ?? "");
  const [excerpt,    setExcerpt]    = useState(initial?.excerpt         ?? "");
  const [type,       setType]       = useState(initial?.releaseType     ?? "ANNOUNCEMENT");
  const [lang,       setLang]       = useState(initial?.originLanguage  ?? "en");
  const [country,    setCountry]    = useState(initial?.originCountry   ?? "MY");
  const [tags,       setTags]       = useState<string[]>(initial?.tags  ?? []);
  const [tagInput,   setTagInput]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function save(status: string) {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!body.trim())  { toast.error("Body is required"); return; }
    status === "DRAFT" ? setSaving(true) : setSubmitting(true);

    const res = await fetch(isEdit ? `/api/releases/${initial!.id}` : "/api/releases", {
      method:  isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, body, excerpt, releaseType: type, originLanguage: lang, originCountry: country, tags, status }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Failed to save");
    } else {
      const direct = canPublishDirectly(session.role);
      if (status === "DRAFT") toast.success("Draft saved");
      else toast.success(direct ? "Submitted" : "Submitted for HOD review");
      router.push(`/dashboard/releases/${json.id ?? initial?.id}`);
      router.refresh();
    }
    setSaving(false); setSubmitting(false);
  }

  const submitStatus = canPublishDirectly(session.role) ? "APPROVED" : "PENDING";

  return (
    <div className="space-y-5">
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Release type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Language</label>
          <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Country / Market</label>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Title</label>
          <input type="text" className="input text-base font-medium" placeholder="Release headline…"
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Excerpt <span className="text-[#64748b] font-normal">(short summary)</span></label>
          <input type="text" className="input" placeholder="One sentence summary…"
            value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div>
          <label className="label">Body <span className="text-[#64748b] font-normal">(Markdown supported)</span></label>
          <textarea className="input resize-none font-mono text-sm" rows={16}
            placeholder={`Write your release here...\n\n**Bold**, *italic*, # Heading`}
            value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="mt-1 text-[10px] text-[#64748b] text-right">{body.length} characters</p>
        </div>
      </div>

      <div className="card p-5">
        <label className="label">Tags</label>
        <div className="flex gap-2 mb-3">
          <input type="text" className="input flex-1" placeholder="Add a tag…"
            value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
          <button type="button" onClick={addTag} className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0">
            <Tag size={14} /> Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950 text-indigo-300 text-xs rounded-full border border-indigo-800">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-indigo-400 hover:text-indigo-200">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-1">
        {canPublishDirectly(session.role)
          ? <p className="text-xs text-emerald-400">✓ Your role can submit directly — no HOD approval required.</p>
          : <p className="text-xs text-[#64748b]">Submitting will send this release to your HOD for approval.</p>
        }
      </div>

      <div className="flex items-center gap-3 pb-8">
        <button onClick={() => save("DRAFT")} disabled={saving || submitting}
          className="btn-secondary flex items-center gap-2">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save draft
        </button>
        <button onClick={() => save(submitStatus)} disabled={saving || submitting}
          className="btn-primary flex items-center gap-2">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {canPublishDirectly(session.role) ? "Submit" : "Submit for review"}
        </button>
      </div>
    </div>
  );
}
