"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/session";

export function TopBar({ session }: { session: SessionUser }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/auth/login");
  }

  return (
    <header className="h-14 border-b border-[#2a3347] bg-[#161b27] flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <button onClick={handleSignOut} className="btn-ghost p-2 text-[#64748b] hover:text-red-400" title="Sign out">
        <LogOut size={16} />
      </button>
    </header>
  );
}
