"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Search, X, Loader2, Eye, EyeOff } from "lucide-react";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import { UserTable } from "@/components/users/UserTable";
import { getInitials } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  department: string | null;
  country:    string;
  isActive:   boolean;
  createdAt:  Date | string;
  _count:     { releases: number };
};

interface Props {
  users:           User[];
  total:           number;
  page:            number;
  totalPages:      number;
  searchParams:    Record<string, string>;
  roles:           [UserRole, string][];
  sessionId:       string;
  sessionRole:     string;
  canCreate:       boolean;
  assignableRoles: [UserRole, string][];
  countries:       { code: string; label: string }[];
}

// ─── Add User Drawer ──────────────────────────────────────────────────────────

function AddUserDrawer({
  open,
  onClose,
  assignableRoles,
  countries,
  onCreated,
}: {
  open:            boolean;
  onClose:         () => void;
  assignableRoles: [UserRole, string][];
  countries:       { code: string; label: string }[];
  onCreated:       () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [role,    setRole]    = useState(assignableRoles[0]?.[0] ?? "SENIOR_EXECUTIVE");
  const [country, setCountry] = useState("MY");

  const nameRef     = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const deptRef     = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef  = useRef<HTMLInputElement>(null);
  const formRef     = useRef<HTMLFormElement>(null);

  function reset() {
    formRef.current?.reset();
    setRole(assignableRoles[0]?.[0] ?? "SENIOR_EXECUTIVE");
    setCountry("MY");
    setShowPw(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const password  = passwordRef.current?.value ?? "";
    const confirmPw = confirmRef.current?.value  ?? "";

    if (password !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name:       nameRef.current?.value?.trim()  ?? "",
        email:      emailRef.current?.value?.trim() ?? "",
        password,
        role,
        department: deptRef.current?.value?.trim() || null,
        country,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to create user");
      setLoading(false);
      return;
    }
    toast.success(`${nameRef.current?.value ?? "User"} has been added`);
    reset();
    onCreated();
    onClose();
    setLoading(false);
  }

  // ── Drawer shell ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full z-40 w-full max-w-md bg-[#161b27] border-l border-[#2a3347] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a3347] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
              <UserPlus size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f1f5f9]">Add user</h2>
              <p className="text-[11px] text-[#64748b]">Create a new account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 text-[#64748b] hover:text-[#f1f5f9]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="add-user-form" ref={formRef} onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="label">Full name</label>
              <input
                ref={nameRef}
                type="text" required className="input"
                placeholder="e.g. Tan Mei Ling"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Work email</label>
              <input
                ref={emailRef}
                type="email" required className="input"
                placeholder="e.g. tanmeiling@company.com"
                autoComplete="off"
              />
            </div>

            {/* Role */}
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                {assignableRoles.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#64748b]">
                {["HEAD_OF_DEPARTMENT", "SENIOR_MANAGER", "MANAGER"].includes(role)
                  ? "This role can submit releases without HOD approval."
                  : "Submissions from this role require HOD approval."}
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="label">
                Department{" "}
                <span className="text-[#64748b] font-normal">(optional)</span>
              </label>
              <input
                ref={deptRef}
                type="text" className="input"
                placeholder="e.g. Communications"
              />
            </div>

            {/* Country */}
            <div>
              <label className="label">Country</label>
              <select
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2a3347] pt-5">
              <p className="text-sm font-medium text-[#f1f5f9] mb-4">Set password</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPw ? "text" : "password"}
                      required minLength={8}
                      className="input pr-10"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    ref={confirmRef}
                    type={showPw ? "text" : "password"}
                    required
                    className="input"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer — sticky action bar */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#2a3347] flex items-center gap-3 bg-[#161b27]">
          <button
            type="submit"
            form="add-user-form"
            disabled={loading}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
              : <><UserPlus size={15} /> Create user</>
            }
          </button>
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="btn-secondary px-4"
          >
            Cancel
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main page client ─────────────────────────────────────────────────────────

export function UsersPageClient({
  users,
  total,
  page,
  totalPages,
  searchParams,
  roles,
  sessionId,
  sessionRole,
  canCreate,
  assignableRoles,
  countries,
}: Props) {
  const router           = useRouter();
  const [pending, start] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function refresh() {
    start(() => router.refresh());
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#f1f5f9]">User Management</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {total} user{total !== 1 ? "s" : ""} in the system
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
          >
            <UserPlus size={15} /> Add user
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form method="GET" className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search name or email…"
              className="input pl-8 h-9 text-sm"
            />
          </div>
          <select
            name="role"
            defaultValue={searchParams.role ?? ""}
            className="input h-9 text-sm w-52"
          >
            <option value="">All roles</option>
            {roles.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            name="active"
            defaultValue={searchParams.active ?? ""}
            className="input h-9 text-sm w-36"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button type="submit" className="btn-secondary h-9 px-4 text-sm">
            Filter
          </button>
          {(searchParams.q || searchParams.role || searchParams.active) && (
            <Link
              href="/dashboard/users"
              className="btn-ghost h-9 px-3 text-sm text-[#64748b]"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        sessionId={sessionId}
        sessionRole={sessionRole}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs text-[#64748b]">
            Page {page} of {totalPages} · {total} total users
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Add user drawer */}
      {canCreate && (
        <AddUserDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          assignableRoles={assignableRoles}
          countries={countries}
          onCreated={refresh}
        />
      )}
    </div>
  );
}
