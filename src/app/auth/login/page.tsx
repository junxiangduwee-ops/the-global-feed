"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res  = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Invalid credentials");
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

      <div className="flex items-center gap-2.5 mb-10 relative z-10">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Globe size={18} className="text-white" />
        </div>
        <span className="font-semibold text-lg text-[#f1f5f9]">The Global Feed</span>
      </div>

      <div className="card p-8 w-full max-w-sm relative z-10">
        <h1 className="text-xl font-semibold text-[#f1f5f9] mb-1">Welcome back</h1>
        <p className="text-sm text-[#64748b] mb-8">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Work email</label>
            <input type="email" required className="input" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required className="input pr-10"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748b]">
          No account?{" "}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">Create one</Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-[#64748b] text-center max-w-xs relative z-10">
        Access is managed by your organisation. Contact your admin if you cannot sign in.
      </p>
    </div>
  );
}
