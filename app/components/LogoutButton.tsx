"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-4 w-full rounded-lg border border-[#333333] px-4 py-2 text-left text-sm text-gray-400 transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
    >
      Sign out
    </button>
  );
}