import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PipelineDnd from "@/app/features/pipeline/components/PipelineDnd";
import { getPipeline } from "@/app/features/pipeline/lib/getPipeline";
import AppSidebar from "@/app/components/AppSidebar";
import PipelineWorkspace from "@/app/features/pipeline/components/PipelineWorkspace";

import PipelineHeader from "@/app/features/pipeline/components/PipelineHeader";
import { getPipelineStats } from "@/app/features/pipeline/lib/getPipelineStats";

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

  const stats = getPipelineStats(columns);

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#29231D]">
      {/* App Layout Structure with Sidebar */}
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 p-6 lg:p-10 overflow-hidden">
          {/* Header Section with Pipeline Stats */}
          <div className="mb-6">
            <PipelineHeader
              totalDeals={stats.totalDeals}
              totalValue={stats.totalValue}
            />
          </div>

          {/* Pipeline Canvas Container with full responsiveness */}
          <div className="rounded-xl border border-[#EDE7DC] bg-white/45 p-4 backdrop-blur-sm shadow-sm w-full">
            <div className="w-full overflow-hidden">
              <PipelineWorkspace columns={columns} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
