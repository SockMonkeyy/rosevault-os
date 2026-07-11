import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    ["Pipeline Value", "$0"],
    ["Active Leads", "0"],
    ["Under Contract", "0"],
    ["Closings This Month", "0"],
  ];

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">
            {greeting}, {firstName}
          </h2>

          <p className="mt-1 text-gray-400">
            Here&apos;s what&apos;s happening with {organizationName} today.
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d4af37] font-bold text-black">
          {userInitial}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-6"
          >
            <p className="text-sm text-gray-400">{label}</p>

            <p className="mt-3 text-3xl font-semibold text-[#d4af37]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Deal Pipeline</h3>

              <p className="mt-1 text-sm text-gray-400">
                Your active real estate opportunities
              </p>
            </div>

            <button className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e2c35b]">
              + Add Deal
            </button>
          </div>

          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-[#333333] bg-[#111111]">
            <div className="max-w-sm px-6 text-center">
              <p className="text-lg font-medium text-white">
                Your pipeline is ready
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add your first deal to begin tracking opportunities, properties,
                transactions, and closings.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#d4af37]/30 bg-[#151515] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            Rosie AI
          </p>

          <h3 className="mt-4 text-xl font-semibold">How can I help today?</h3>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Ask about your leads, deals, follow-ups, marketing, properties, or
            daily priorities.
          </p>

          <div className="mt-6 rounded-lg border border-[#333333] bg-[#0f0f0f] p-4">
            <p className="text-sm text-gray-500">Ask Rosie anything...</p>
          </div>

          <button className="mt-4 w-full rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-black transition hover:bg-[#e2c35b]">
            Ask Rosie
          </button>
        </div>
      </div>
    </div>
  );
}
