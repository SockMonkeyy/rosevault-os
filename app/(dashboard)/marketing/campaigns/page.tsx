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
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-white">
              Email Campaigns
            </h1>

            <p className="mt-2 max-w-3xl text-gray-400">
              Manage draft, scheduled, active, and completed email
              campaigns from one place.
            </p>
          </div>

          <Link
            href="/email/compose"
            className="rounded-lg bg-[#d4af37] px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            Create Campaign
          </Link>
        </div>

        <EmailCampaignsManager
          initialCampaigns={campaigns ?? []}
          organizationId={membership.organization_id}
        />
      </div>
    </div>
  );
}