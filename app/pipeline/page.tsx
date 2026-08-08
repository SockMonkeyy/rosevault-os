import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PipelineBoard from "@/app/features/pipeline/components/PipelineBoard";
import { getPipeline } from "@/app/features/pipeline/lib/getPipeline";
import AppSidebar from "@/app/components/AppSidebar";

export default async function PipelinePage() {
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
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  const columns = await getPipeline(membership.organization_id);

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#29231D]">
      {/* App Layout Structure with Sidebar */}
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 p-6 lg:p-10 overflow-hidden">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Transaction Management
              </p>

              <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D]">
                Pipeline
              </h1>

              <p className="mt-1.5 text-xs text-[#7C7265]">
                Manage every transaction visually through each stage.
              </p>
            </div>
          </div>

          {/* Pipeline Canvas Container with full responsiveness */}
          <div className="rounded-xl border border-[#EDE7DC] bg-white/45 p-4 backdrop-blur-sm shadow-sm w-full">
            <div className="w-full overflow-hidden">
              <PipelineBoard columns={columns} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}