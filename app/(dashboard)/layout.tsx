import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/app/components/AppSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FBF7EF] text-[#29231D] antialiased selection:bg-[#B7832F]/15 selection:text-[#B7832F]">
      {/* Locked Desktop Sidebar */}
      <AppSidebar />

      {/* Main Content Workspace Canvas */}
      <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#FBF7EF]">
        {children}
      </main>
    </div>
  );
}