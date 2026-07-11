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
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={
                initialCampaign
                  ? "/marketing/campaigns"
                  : "/contacts"
              }
              className="mb-4 inline-block text-sm text-[#d4af37] transition hover:text-[#e2c35b] hover:underline"
            >
              ←{" "}
              {initialCampaign
                ? "Back to Campaigns"
                : "Back to Contacts"}
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-white">
              {initialCampaign
                ? "Edit Email Campaign"
                : "Bulk Email Composer"}
            </h1>

            <p className="mt-2 max-w-3xl text-gray-400">
              {initialCampaign
                ? "Update your saved campaign draft, recipients, message, and personalization."
                : "Select recipients, apply a reusable template, personalize each message, and preview your campaign before sending."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/marketing/campaigns"
              className="rounded-lg border border-[#333333] px-5 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              View Campaigns
            </Link>

            <Link
              href="/email/templates"
              className="rounded-lg border border-[#333333] px-5 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Manage Templates
            </Link>
          </div>
        </div>

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