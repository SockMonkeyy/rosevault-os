import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmailCampaignsManager from "@/app/components/EmailCampaignsManager";

export default async function CampaignsPage() {
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

  const { data: campaigns, error } = await supabase
    .from("email_campaigns")
    .select(`
      id,
      name,
      subject,
      status,
      recipient_count,
      scheduled_for,
      sent_at,
      created_at,
      updated_at
    `)
    .eq("organization_id", membership.organization_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading email campaigns:", error);
  }

    return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              Email Campaigns
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
              Manage draft, scheduled, active, and completed email campaigns
              from one place.
            </p>
          </div>

          <Link
            href="/email/compose"
            className="cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-center text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
          >
            Create Campaign
          </Link>
        </div>

        {/* Campaign Manager */}
        <EmailCampaignsManager
          initialCampaigns={campaigns ?? []}
          organizationId={membership.organization_id}
        />
      </div>
    </div>
  );
}