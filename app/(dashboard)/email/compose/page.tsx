import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkEmailComposer from "@/app/components/BulkEmailComposer";

type ComposeEmailPageProps = {
  searchParams: Promise<{
    contacts?: string;
    campaign?: string;
  }>;
};

export default async function ComposeEmailPage({
  searchParams,
}: ComposeEmailPageProps) {
  const params = await searchParams;

  // Get contact IDs passed from the Contacts page.
  const initialSelectedContactIds = params.contacts
    ? params.contacts
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's organization.
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "Error loading organization membership:",
      membershipError,
    );
  }

  if (!membership) {
    redirect("/onboarding");
  }

  // Load contacts that have email addresses.
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      email,
      mailing_address_line_1,
      mailing_address_line_2,
      mailing_city,
      mailing_state,
      mailing_postal_code,
      property_address_line_1,
      property_address_line_2,
      property_city,
      property_state,
      property_postal_code
    `)
    .eq("organization_id", membership.organization_id)
    .not("email", "is", null)
    .order("first_name", { ascending: true });

  if (contactsError) {
    console.error(
      "Error loading email contacts:",
      contactsError,
    );
  }

  // Load active email templates for this organization.
  const { data: templates, error: templatesError } = await supabase
    .from("email_templates")
    .select(`
      id,
      name,
      subject,
      body,
      category
    `)
    .eq("organization_id", membership.organization_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (templatesError) {
    console.error(
      "Error loading email templates:",
      templatesError,
    );
  }

  // Existing campaign data is loaded only when a campaign ID
  // is included in the URL.
  let initialCampaign: {
    id: string;
    name: string;
    subject: string;
    body: string;
    template_id: string | null;
    status: string;
  } | null = null;

  let campaignRecipientIds: string[] = [];

  if (params.campaign) {
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select(`
        id,
        name,
        subject,
        body,
        template_id,
        status
      `)
      .eq("id", params.campaign)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (campaignError) {
      console.error(
        "Error loading email campaign:",
        campaignError,
      );
    }

    // Only draft campaigns can currently be edited.
    if (campaign && campaign.status === "draft") {
      initialCampaign = campaign;

      const {
        data: recipients,
        error: recipientsError,
      } = await supabase
        .from("email_campaign_recipients")
        .select("contact_id")
        .eq("campaign_id", campaign.id);

      if (recipientsError) {
        console.error(
          "Error loading campaign recipients:",
          recipientsError,
        );
      }

      campaignRecipientIds = (recipients ?? [])
        .map((recipient) => recipient.contact_id)
        .filter((id): id is string => Boolean(id));
    }
  }

  // If editing an existing campaign, use its saved recipients.
  // Otherwise, use contact IDs passed from the Contacts page.
  const selectedContactIds =
    initialCampaign && campaignRecipientIds.length > 0
      ? campaignRecipientIds
      : initialSelectedContactIds;

    return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href={initialCampaign ? "/marketing/campaigns" : "/contacts"}
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              ←
            </span>

            {initialCampaign ? "Back to Campaigns" : "Back to Contacts"}
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                RoseVault Communications
              </p>

              <h1 className="mt-2 font-serif text-3xl font-normal tracking-wide text-[#29231D]">
                {initialCampaign
                  ? "Edit Email Campaign"
                  : "Bulk Email Composer"}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
                {initialCampaign
                  ? "Update your saved campaign draft, recipients, message, and personalization."
                  : "Select recipients, apply a reusable template, personalize each message, and preview your campaign before sending."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/marketing/campaigns"
                className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-center text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
              >
                View Campaigns
              </Link>

              <Link
                href="/email/templates"
                className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-center text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
              >
                Manage Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Composer */}
        <BulkEmailComposer
          contacts={contacts ?? []}
          templates={templates ?? []}
          initialSelectedContactIds={selectedContactIds}
          organizationId={membership.organization_id}
          userId={user.id}
          initialCampaign={initialCampaign}
        />
      </div>
    </div>
  );
}