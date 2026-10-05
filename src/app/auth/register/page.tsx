"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/types";

const ROLES = Object.entries(ROLE_LABELS) as [string, string][];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", department: "", role: "SENIOR_EXECUTIVE", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const res  = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Registration failed");
      setLoading(false);
    } else {
      toast.success("Account created — you can now sign in");
      router.push("/auth/login");
    }
  }

  const needsApproval = ["ASSISTANT_MANAGER", "SENIOR_EXECUTIVE"].includes(form.role);

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

      <div className="flex items-center gap-2.5 mb-10 relative z-10">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Globe size={18} className="text-white" />
        </div>
        <span className="font-semibold text-lg text-[#f1f5f9]">The Global Feed</span>
      </div>

      <div className="card p-8 w-full max-w-sm relative z-10">
        <h1 className="text-xl font-semibold text-[#f1f5f9] mb-1">Create account</h1>
        <p className="text-sm text-[#64748b] mb-8">Join your organisation's workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Full name</label>
            <input type="text" required className="input" placeholder="Tan Mei Ling"
              value={form.name} onChange={set("name")} /></div>
          <div><label className="label">Work email</label>
            <input type="email" required className="input" placeholder="you@company.com"
              value={form.email} onChange={set("email")} /></div>
          <div><label className="label">Department</label>
            <input type="text" className="input" placeholder="Communications, Marketing…"
              value={form.department} onChange={set("department")} /></div>
          <div>
            <label className="label">Your role</label>
            <select className="input" value={form.role} onChange={set("role")}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <p className="mt-1 text-xs text-[#64748b]">
              {needsApproval
                ? "Your submissions will require HOD approval."
                : "You can submit directly without HOD approval."}
            </p>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required minLength={8}
                className="input pr-10" placeholder="Min. 8 characters"
                value={form.password} onChange={set("password")} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748b]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
