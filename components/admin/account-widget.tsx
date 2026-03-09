"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AccountWidgetProps = {
  email?: string | null;
};

export function AccountWidget({ email }: AccountWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const normalizedEmail = email?.trim() ? email : "Unknown user";
  const avatarLetter = normalizedEmail === "Unknown user" ? "?" : normalizedEmail[0]?.toUpperCase() ?? "?";

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="w-full rounded-2xl border border-slate-700/40 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[linear-gradient(135deg,#22d3ee,#3b82f6,#8b5cf6)] p-[1.5px] shadow-lg shadow-cyan-400/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-slate-100">
            {avatarLetter}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Signed In</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-100">{normalizedEmail}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={isLoading}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Signing out..." : "Log out"}
      </button>
    </div>
  );
}
