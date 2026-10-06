"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface UserData {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  department: string | null;
  country:    string;
  isActive:   boolean;
}

interface Props {
  mode:            "create" | "edit";
  user?:           UserData;
  assignableRoles: [UserRole, string][];
  countries:       { code: string; label: string }[];
  isSelf?:         boolean;
  isAdmin?:        boolean;
  backHref:        string;
}

export function UserForm({
  mode,
  user,
  assignableRoles,
  countries,
  isSelf   = false,
  isAdmin  = false,
  backHref,
}: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [form, setForm] = useState({
    name:       user?.name       ?? "",
    email:      user?.email      ?? "",
    role:       user?.role       ?? (assignableRoles[0]?.[0] ?? "SENIOR_EXECUTIVE"),
    department: user?.department ?? "",
    country:    user?.country    ?? "MY",
    password:   "",
    confirmPw:  "",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);

    const payload: Record<string, unknown> = {
      name:       form.name,
      role:       form.role,
      department: form.department || null,
      country:    form.country,
    };
    if (mode === "create") {
      payload.email    = form.email;
      payload.password = form.password;
    }
    if (mode === "edit" && form.password) {
      payload.password = form.password;
    }

    const url    = mode === "create" ? "/api/users" : `/api/users/${user!.id}`;
    const method = mode === "create" ? "POST"       : "PATCH";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    toast.success(mode === "create" ? "User created successfully" : "Changes saved");
    router.push(backHref);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Full name</label>
          <input
            type="text" required className="input"
            placeholder="Tan Mei Ling"
            value={form.name} onChange={set("name")}
          />
        </div>

        {/* Email — read-only on edit */}
        <div>
          <label className="label">Work email</label>
          {mode === "create" ? (
            <input
              type="email" required className="input"
              placeholder="you@company.com"
              value={form.email} onChange={set("email")}
            />
          ) : (
            <div className="input bg-[#0f1117]/60 text-[#64748b] cursor-not-allowed select-none">
              {user?.email}
              <span className="ml-2 text-[10px] opacity-60">(cannot be changed)</span>
            </div>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="label">Role</label>
          {assignableRoles.length === 1 && isSelf ? (
            <div className="input bg-[#0f1117]/60 text-[#64748b] cursor-not-allowed select-none">
              {assignableRoles[0][1]}
              <span className="ml-2 text-[10px] opacity-60">(your role cannot be changed here)</span>
            </div>
          ) : (
            <select className="input" value={form.role} onChange={set("role")}>
              {assignableRoles.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="label">Department <span className="text-[#64748b] font-normal">(optional)</span></label>
          <input
            type="text" className="input"
            placeholder="Communications, Marketing…"
            value={form.department} onChange={set("department")}
          />
        </div>

        {/* Country */}
        <div>
          <label className="label">Country</label>
          <select className="input" value={form.country} onChange={set("country")}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Password section */}
        <div className="border-t border-[#2a3347] pt-5">
          <p className="text-sm font-medium text-[#f1f5f9] mb-4">
            {mode === "create" ? "Set password" : "Change password"}
            {mode === "edit" && (
              <span className="ml-2 text-xs text-[#64748b] font-normal">
                Leave blank to keep current password
              </span>
            )}
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">{mode === "create" ? "Password" : "New password"}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder={mode === "create" ? "Min. 8 characters" : "Leave blank to keep current"}
                  minLength={mode === "create" ? 8 : 0}
                  required={mode === "create"}
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {form.password && (
              <div>
                <label className="label">Confirm password</label>
                <input
                  type={showPw ? "text" : "password"}
                  className="input"
                  placeholder="Repeat new password"
                  value={form.confirmPw}
                  onChange={set("confirmPw")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === "create" ? "Create user" : "Save changes"}
          </button>
          <Link href={backHref} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
