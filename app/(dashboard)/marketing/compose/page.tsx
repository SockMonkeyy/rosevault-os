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

type InitialCampaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_id: string | null;
  status: string;
  campaign_stage: string | null;
  stage_order: number | null;
  last_template_id: string | null;
  last_template_name: string | null;
};

export default async function ComposeEmailPage({
  searchParams,
}: ComposeEmailPageProps) {
  const params = await searchParams;

  // ============================================================
  // INITIAL CONTACTS
  // ============================================================

  const initialSelectedContactIds = params.contacts
    ? params.contacts
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ============================================================
  // ORGANIZATION
  // ============================================================

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

  // ============================================================
  // CONTACTS
  // ============================================================

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
    .order("first_name", {
      ascending: true,
    });

  if (contactsError) {
    console.error(
      "Error loading email contacts:",
      contactsError,
    );
  }

  // ============================================================
  // EMAIL TEMPLATES
  // ============================================================

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
    .order("name", {
      ascending: true,
    });

  if (templatesError) {
    console.error(
      "Error loading email templates:",
      templatesError,
    );
  }

  // ============================================================
  // CAMPAIGN
  // ============================================================

  let initialCampaign: InitialCampaign | null = null;

  let campaignRecipientIds: string[] = [];

  if (params.campaign) {
    const {
      data: campaign,
      error: campaignError,
    } = await supabase
      .from("email_campaigns")
      .select(`
        id,
        name,
        subject,
        body,
        template_id,
        status,
        campaign_stage,
        stage_order,
        last_template_id,
        last_template_name
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

    if (campaign) {
      initialCampaign = campaign;

      // ========================================================
      // LOAD SAVED RECIPIENTS
      // ========================================================

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
        .map(
          (recipient) => recipient.contact_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        );
    }
  }

  // ============================================================
  // SELECTED CONTACTS
  // ============================================================

  const selectedContactIds =
    initialCampaign &&
    campaignRecipientIds.length > 0
      ? campaignRecipientIds
      : initialSelectedContactIds;

  // ============================================================
  // PAGE STATE
  // ============================================================

  const isEditingCampaign =
    Boolean(initialCampaign);

  const isEditable =
    !initialCampaign ||
    initialCampaign.status === "draft";

  return (
    <div className="min-h-screen bg-[#FBF7EF] px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ======================================================
            BACK LINK
        ====================================================== */}

        <Link
          href={
            isEditingCampaign
              ? "/marketing/campaigns"
              : "/marketing"
          }
          className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          >
            ←
          </span>

          {isEditingCampaign
            ? "Back to Campaigns"
            : "Back to Marketing"}
        </Link>

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="mt-6 mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              RoseVault Communications
            </p>

            <h1 className="mt-2 font-serif text-4xl font-normal tracking-wide text-[#29231D]">
              {isEditingCampaign
                ? "Edit Email Campaign"
                : "Compose Email"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#7C7265]">
              {isEditingCampaign
                ? "Review and update your campaign, recipients, stage, template, and message."
                : "Send professional emails to clients, leads, vendors, or transaction contacts."}
            </p>
          </div>

          {/* ====================================================
              QUICK ACTIONS
          ==================================================== */}

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

        {/* ======================================================
            CAMPAIGN INFORMATION
        ====================================================== */}

        {initialCampaign && (
          <section className="mb-6 rounded-xl border border-[#D8B66A]/35 bg-white/50 p-5 backdrop-blur-sm">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              {/* LAST STAGE */}

              <div className="rounded-lg border border-[#E3DCD0] bg-white/60 p-4">

                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
                  Last Stage
                </p>

                <p className="mt-1 font-serif text-sm text-[#29231D]">
                  {initialCampaign.campaign_stage ??
                    "Introduction"}
                </p>

                <p className="mt-1 text-[10px] text-[#8F8578]">
                  Stage{" "}
                  {initialCampaign.stage_order ??
                    1}{" "}
                  of 7
                </p>

              </div>

              {/* NEXT STAGE */}

              <div className="rounded-lg border border-[#D8B66A]/40 bg-[#B7832F]/5 p-4">

                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#B7832F]">
                  Next Stage
                </p>

                <p className="mt-1 font-serif text-sm text-[#29231D]">
                  {initialCampaign.stage_order &&
                  initialCampaign.stage_order < 7
                    ? getNextStage(
                        initialCampaign.stage_order,
                      )
                    : "Campaign Complete"}
                </p>

                <p className="mt-1 text-[10px] text-[#8F8578]">
                  {initialCampaign.stage_order &&
                  initialCampaign.stage_order < 7
                    ? "Ready for next outreach"
                    : "No further outreach"}
                </p>

              </div>

              {/* LAST TEMPLATE */}

              <div className="rounded-lg border border-[#E3DCD0] bg-white/60 p-4">

                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
                  Last Template Sent
                </p>

                <p className="mt-1 truncate font-serif text-sm text-[#29231D]">
                  {initialCampaign.last_template_name ??
                    "No template sent yet"}
                </p>

                <p className="mt-1 text-[10px] text-[#8F8578]">
                  Campaign status:{" "}
                  {initialCampaign.status}
                </p>

              </div>

            </div>

            {/* ==================================================
                RECIPIENT SUMMARY
            ================================================== */}

            <div className="mt-3 rounded-lg border border-[#E3DCD0] bg-white/60 px-4 py-3">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
                    Saved Recipients
                  </p>

                  <p className="mt-1 font-serif text-sm text-[#29231D]">
                    {selectedContactIds.length}{" "}
                    {selectedContactIds.length === 1
                      ? "contact"
                      : "contacts"}
                  </p>
                </div>

                {!isEditable && (
                  <span className="rounded-full border border-[#E3DCD0] bg-[#F1ECE4] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8F8578]">
                    View Only
                  </span>
                )}

              </div>

            </div>
          </section>
        )}

        {/* ======================================================
            COMPOSER
        ====================================================== */}

        <section className="rounded-2xl border border-[#EDE7DC] bg-white/50 p-5 shadow-sm backdrop-blur-sm lg:p-8">

          <BulkEmailComposer
            contacts={contacts ?? []}
            templates={templates ?? []}
            initialSelectedContactIds={
              selectedContactIds
            }
            organizationId={
              membership.organization_id
            }
            userId={user.id}
            initialCampaign={
              initialCampaign
            }
          />

        </section>

      </div>
    </div>
  );
}

// ============================================================
// NEXT CAMPAIGN STAGE
// ============================================================

function getNextStage(stageOrder: number) {
  const stages = [
    "Introduction",
    "Follow-Up 1",
    "Follow-Up 2",
    "Follow-Up 3",
    "Final Follow-Up",
    "Nurture",
    "Completed",
  ];

  return stages[stageOrder] ?? "Campaign Complete";
}