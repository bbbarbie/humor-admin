"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600/60 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-[rgba(59,130,246,0.15)] hover:text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Signing out..." : "Log out"}
    </button>
  );
}
