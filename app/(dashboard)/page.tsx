import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatCard from "@/app/components/ui/StatCard";
import { getDashboardMetrics } from "@/lib/dashboard/getDashboardmetrics";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", membership.organization_id)
    .single();

  const { pipelineValue, activeLeads, underContract, closingsThisMonth } =
    await getDashboardMetrics(membership.organization_id);


  const formattedPipelineValue = pipelineValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const firstName =
    profile?.first_name || user.user_metadata?.first_name || "there";

  const organizationName = organization?.name || "Your Organization";

  const userInitial =
    firstName && firstName !== "there"
      ? firstName.charAt(0).toUpperCase()
      : "U";

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  const metrics = [
    ["Pipeline Value", formattedPipelineValue],
    ["Active Leads", activeLeads],
    ["Under Contract", underContract],
    ["Closings This Month", closingsThisMonth],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-12 lg:py-16">
      {/* Editorial Header Section */}
      <header className="mb-12 flex items-center justify-between gap-6 border-b border-[#EDE7DC]/60 pb-8">
        <div>
          <h2 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
            {greeting}, {firstName}
          </h2>
          <p className="mt-2 text-xs tracking-wide text-[#7C7265]">
            Here&apos;s the current status of your workspace inside{" "}
            <span className="font-medium text-[#29231D]">
              {organizationName}
            </span>{" "}
            today.
          </p>
        </div>

        {/* Profile Avatar Badge with Hover Scale and Pointer Cursor */}
        <div className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#171512] text-xs font-semibold tracking-wider text-[#D8B66A] transition-transform duration-300 hover:scale-105">
          {userInitial}
        </div>
      </header>

      {/* Metrics Section with Interactive Clickable Card Micro-Elevation */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <StatCard
            key={label}
            title={label}
            value={value}
            subtitle="Live business metric"
          />
        ))}
      </div>

      {/* Primary Workspace Layout Split */}
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Left Side: Pipeline Portfolio Area */}
        <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 xl:col-span-2">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="font-serif text-xl font-normal tracking-wide text-[#29231D]">
                Deal Pipeline
              </h3>
              <p className="mt-1 text-xs text-[#7C7265]">
                Active commercial and private real estate opportunities
              </p>
            </div>

            <button className="cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-2.5 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 ease-out hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.98]">
              + Add Deal
            </button>
          </div>

          {/* Empty Slate Dashboard Wrapper with Interactive Micro-Shift */}
          <div className="flex min-h-72 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] transition-colors duration-300 hover:border-[#D8B66A]/25 hover:bg-[#12110F]/[0.02]">
            <div className="max-w-sm px-6 text-center">
              <p className="font-serif text-lg text-[#29231D]">
                Your pipeline is ready
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
                Add your first deal transaction to begin securely mapping asset
                portfolios, buyer profiles, pipelines, and upcoming closing
                logs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Contextual Assistant Card (Rosie AI) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#D8B66A]/25 bg-[#12110F]/[0.02] p-8 transition-all duration-300 hover:border-[#D8B66A]/40 hover:bg-[#12110F]/[0.04]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Rosie AI
            </p>
            <h3 className="mt-3 font-serif text-2xl font-normal tracking-wide text-[#29231D]">
              How can I support your pipeline today?
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[#7C7265]">
              Request immediate insights across lead registries, outstanding
              tasks, portfolio valuations, or marketing templates.
            </p>

            {/* Interactive Simulated Input Area */}
            <div className="group mt-8 cursor-pointer rounded-md border border-[#EDE7DC] bg-white/70 p-4 transition-all duration-300 focus-within:border-[#B7832F]/50 hover:border-[#C4BCB1] hover:bg-white/90">
              <p className="text-xs text-[#A89C8D] tracking-wide transition-colors duration-300 group-hover:text-[#7C7265]">
                Ask Rosie a question...
              </p>
            </div>
          </div>

          <button className="mt-8 w-full cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 ease-out hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.98]">
            Consult Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
