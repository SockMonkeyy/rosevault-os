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

const CAMPAIGN_STAGES = [
  {
    value: "Introduction",
    order: 1,
  },
  {
    value: "Follow-Up 1",
    order: 2,
  },
  {
    value: "Follow-Up 2",
    order: 3,
  },
  {
    value: "Follow-Up 3",
    order: 4,
  },
  {
    value: "Final Follow-Up",
    order: 5,
  },
  {
    value: "Nurture",
    order: 6,
  },
  {
    value: "Completed",
    order: 7,
  },
];

function getStageByOrder(
  stageOrder: number | null,
) {
  if (!stageOrder) {
    return CAMPAIGN_STAGES[0];
  }

  return (
    CAMPAIGN_STAGES.find(
      (stage) =>
        stage.order === stageOrder,
    ) ??
    CAMPAIGN_STAGES[0]
  );
}

function getNextCampaignStage(
  stageOrder: number | null,
) {
  if (!stageOrder) {
    return CAMPAIGN_STAGES[0];
  }

  return (
    CAMPAIGN_STAGES.find(
      (stage) =>
        stage.order === stageOrder + 1,
    ) ?? null
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";

    case "sending":
      return "Sending";

    case "sent":
      return "Sent";

    case "failed":
      return "Failed";

    case "scheduled":
      return "Scheduled";

    default:
      return status;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "sent":
      return "border-[#B7832F]/30 bg-[#B7832F]/10 text-[#8A6120]";

    case "sending":
      return "border-[#D8B66A]/40 bg-[#F5EEDF] text-[#8A6120]";

    case "failed":
      return "border-red-200 bg-red-50 text-red-700";

    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "draft":
    default:
      return "border-[#E3DCD0] bg-[#F5EEDF] text-[#7C7265]";
  }
}

export default async function ComposeEmailPage({
  searchParams,
}: ComposeEmailPageProps) {
  const params = await searchParams;

  // ============================================================
  // CONTACTS PASSED FROM CONTACTS PAGE
  // ============================================================

  const initialSelectedContactIds =
    params.contacts
      ? params.contacts
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

  const supabase = await createClient();

  // ============================================================
  // AUTHENTICATED USER
  // ============================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ============================================================
  // ORGANIZATION MEMBERSHIP
  // ============================================================

  const {
    data: membership,
    error: membershipError,
  } = await supabase
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
  // LOAD CONTACTS
  // ============================================================

  const {
    data: contacts,
    error: contactsError,
  } = await supabase
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
    .eq(
      "organization_id",
      membership.organization_id,
    )
    .not(
      "email",
      "is",
      null,
    )
    .order(
      "first_name",
      {
        ascending: true,
      },
    );

  if (contactsError) {
    console.error(
      "Error loading email contacts:",
      contactsError,
    );
  }

  // ============================================================
  // LOAD EMAIL TEMPLATES
  // ============================================================

  const {
    data: templates,
    error: templatesError,
  } = await supabase
    .from("email_templates")
    .select(`
      id,
      name,
      subject,
      body,
      category
    `)
    .eq(
      "organization_id",
      membership.organization_id,
    )
    .eq(
      "is_active",
      true,
    )
    .order(
      "name",
      {
        ascending: true,
      },
    );

  if (templatesError) {
    console.error(
      "Error loading email templates:",
      templatesError,
    );
  }

  // ============================================================
  // EXISTING CAMPAIGN
  // ============================================================

  let initialCampaign:
    InitialCampaign | null = null;

  let campaignRecipientIds: string[] = [];

  // ============================================================
  // LOAD CAMPAIGN WHEN EDITING
  // ============================================================

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
      .eq(
        "id",
        params.campaign,
      )
      .eq(
        "organization_id",
        membership.organization_id,
      )
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
      //
      // Recipients are loaded regardless of campaign status.
      // This preserves the campaign audience when reopening
      // previously sent campaigns.
      // ========================================================

      const {
        data: recipients,
        error: recipientsError,
      } = await supabase
        .from(
          "email_campaign_recipients",
        )
        .select("contact_id")
        .eq(
          "campaign_id",
          campaign.id,
        );

      if (recipientsError) {
        console.error(
          "Error loading campaign recipients:",
          recipientsError,
        );
      }

      campaignRecipientIds =
        (recipients ?? [])
          .map(
            (recipient) =>
              recipient.contact_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          );
    }
  }

  // ============================================================
  // SELECTED RECIPIENTS
  // ============================================================

  const selectedContactIds =
    initialCampaign
      ? campaignRecipientIds
      : initialSelectedContactIds;

  // ============================================================
  // CAMPAIGN DISPLAY INFORMATION
  // ============================================================

  const currentStage =
    initialCampaign
      ? getStageByOrder(
          initialCampaign.stage_order,
        )
      : null;

  const nextStage =
    initialCampaign
      ? getNextCampaignStage(
          currentStage?.order ??
            initialCampaign.stage_order,
        )
      : null;

  const isExistingCampaign =
    Boolean(initialCampaign);

  const isEditable =
    !initialCampaign ||
    initialCampaign.status === "draft";

  const currentStageOrder =
    currentStage?.order ?? 1;

  const progressPercent =
    (currentStageOrder /
      CAMPAIGN_STAGES.length) *
    100;

  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* ======================================================
            TOP NAVIGATION
        ====================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href={
              isExistingCampaign
                ? "/marketing/campaigns"
                : "/contacts"
            }
            className="group inline-flex w-fit items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              ←
            </span>

            {isExistingCampaign
              ? "Back to Campaigns"
              : "Back to Contacts"}
          </Link>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/marketing/campaigns"
              className="rounded-md border border-[#E3DCD0] bg-white px-4 py-2.5 text-[11px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:border-[#D8B66A]/60 hover:bg-[#FBF7EF] hover:text-[#B7832F]"
            >
              Campaign Manager
            </Link>

            <Link
              href="/email/templates"
              className="rounded-md border border-[#E3DCD0] bg-white px-4 py-2.5 text-[11px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:border-[#D8B66A]/60 hover:bg-[#FBF7EF] hover:text-[#B7832F]"
            >
              Templates
            </Link>

          </div>
        </div>

        {/* ======================================================
            HERO / CAMPAIGN HEADER
        ====================================================== */}

        <div className="mt-7 overflow-hidden rounded-2xl border border-[#EDE7DC] bg-white shadow-[0_18px_50px_rgba(41,35,29,0.06)]">

          <div className="relative px-6 py-7 sm:px-8 lg:px-10 lg:py-9">

            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#B7832F]/5 blur-3xl" />

            <div className="relative">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                <div className="max-w-3xl">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B7832F]">
                      RoseVault Communications
                    </span>

                    {isExistingCampaign && (
                      <>
                        <span className="text-[#D8B66A]">
                          •
                        </span>

                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A89C8D]">
                          Campaign Workspace
                        </span>
                      </>
                    )}

                  </div>

                  <h1 className="mt-3 font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl lg:text-[2.65rem]">
                    {isExistingCampaign
                      ? initialCampaign?.name
                      : "Build Your Email Campaign"}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7C7265]">
                    {isExistingCampaign
                      ? "Manage your campaign audience, stage, template, message, and delivery from one workspace."
                      : "Build a polished outreach campaign, select your audience, personalize the message, and send when you're ready."}
                  </p>

                </div>

                {/* STATUS */}

                {initialCampaign && (
                  <div className="flex flex-wrap items-center gap-2">

                    <span
                      className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(
                        initialCampaign.status,
                      )}`}
                    >
                      {getStatusLabel(
                        initialCampaign.status,
                      )}
                    </span>

                    <span className="rounded-full border border-[#D8B66A]/40 bg-[#B7832F]/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8A6120]">
                      {currentStage?.value ??
                        "Introduction"}
                    </span>

                  </div>
                )}

              </div>

              {/* ==================================================
                  CAMPAIGN SUBJECT
              ================================================== */}

              {initialCampaign?.subject && (
                <div className="mt-6 rounded-xl border border-[#EDE7DC] bg-[#FBF7EF]/70 px-4 py-3 sm:px-5">

                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                    Subject Line
                  </p>

                  <p className="mt-1 text-sm text-[#29231D]">
                    {initialCampaign.subject}
                  </p>

                </div>
              )}

            </div>
          </div>

          {/* ====================================================
              CAMPAIGN JOURNEY
          ==================================================== */}

          {initialCampaign && (
            <div className="border-t border-[#EDE7DC] bg-[#FBF7EF]/45 px-6 py-6 sm:px-8 lg:px-10">

              <div className="flex flex-col gap-5">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
                      Campaign Journey
                    </p>

                    <p className="mt-1 text-xs text-[#7C7265]">
                      Track where this campaign has been and what comes next.
                    </p>
                  </div>

                  <p className="text-[10px] font-medium text-[#8F8578]">
                    Stage {currentStageOrder} of{" "}
                    {CAMPAIGN_STAGES.length}
                  </p>

                </div>

                {/* STAGE TRACK */}

                <div className="relative">

                  <div className="absolute left-0 right-0 top-4 hidden h-px bg-[#E3DCD0] md:block" />

                  <div
                    className="absolute left-0 top-4 hidden h-px bg-[#B7832F] transition-all duration-500 md:block"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((currentStageOrder - 1) /
                            (CAMPAIGN_STAGES.length - 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />

                  <div className="relative grid grid-cols-2 gap-y-5 sm:grid-cols-4 md:grid-cols-7">

                    {CAMPAIGN_STAGES.map(
                      (stage) => {
                        const isCurrent =
                          stage.order ===
                          currentStageOrder;

                        const isComplete =
                          stage.order <
                          currentStageOrder;

                        return (
                          <div
                            key={stage.value}
                            className="flex flex-col items-center text-center"
                          >

                            <div
                              className={[
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold transition-all duration-300",
                                isCurrent
                                  ? "border-[#B7832F] bg-[#0D0C0A] text-[#D8B66A] shadow-md"
                                  : isComplete
                                    ? "border-[#B7832F] bg-[#B7832F] text-white"
                                    : "border-[#E3DCD0] bg-white text-[#A89C8D]",
                              ].join(" ")}
                            >
                              {isComplete
                                ? "✓"
                                : stage.order}
                            </div>

                            <p
                              className={[
                                "mt-2 max-w-[90px] text-[9px] leading-4",
                                isCurrent
                                  ? "font-semibold text-[#29231D]"
                                  : isComplete
                                    ? "text-[#7C7265]"
                                    : "text-[#A89C8D]",
                              ].join(" ")}
                            >
                              {stage.value}
                            </p>

                          </div>
                        );
                      },
                    )}

                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ======================================================
            CAMPAIGN SNAPSHOT
        ====================================================== */}

        {initialCampaign && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* LAST STAGE */}

            <div className="group rounded-xl border border-[#E3DCD0] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                  Last Stage
                </p>

                <span className="text-[#B7832F]">
                  ◇
                </span>

              </div>

              <p className="mt-3 font-serif text-lg text-[#29231D]">
                {currentStage?.value ??
                  "Introduction"}
              </p>

              <p className="mt-1 text-[10px] text-[#8F8578]">
                Stage {currentStageOrder} of{" "}
                {CAMPAIGN_STAGES.length}
              </p>

            </div>

            {/* NEXT STAGE */}

            <div className="rounded-xl border border-[#D8B66A]/40 bg-[#B7832F]/5 p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B7832F]">
                  Next Stage
                </p>

                <span className="text-[#B7832F]">
                  →
                </span>

              </div>

              <p className="mt-3 font-serif text-lg text-[#29231D]">
                {nextStage
                  ? nextStage.value
                  : "Campaign Complete"}
              </p>

              <p className="mt-1 text-[10px] text-[#8F8578]">
                {nextStage
                  ? "Recommended next outreach"
                  : "No further outreach"}
              </p>

            </div>

            {/* LAST TEMPLATE */}

            <div className="rounded-xl border border-[#E3DCD0] bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                  Last Template
                </p>

                <span className="text-[#B7832F]">
                  ✦
                </span>

              </div>

              <p className="mt-3 truncate font-serif text-lg text-[#29231D]">
                {initialCampaign.last_template_name ??
                  "Not sent yet"}
              </p>

              <p className="mt-1 text-[10px] text-[#8F8578]">
                {initialCampaign.last_template_name
                  ? "Most recent template used"
                  : "No template recorded"}
              </p>

            </div>

            {/* RECIPIENTS */}

            <div className="rounded-xl border border-[#E3DCD0] bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                  Saved Audience
                </p>

                <span className="text-[#B7832F]">
                  ○
                </span>

              </div>

              <p className="mt-3 font-serif text-lg text-[#29231D]">
                {selectedContactIds.length}
              </p>

              <p className="mt-1 text-[10px] text-[#8F8578]">
                {selectedContactIds.length === 1
                  ? "saved recipient"
                  : "saved recipients"}
              </p>

            </div>

          </div>
        )}

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* ====================================================
              MAIN COMPOSER
          ==================================================== */}

          <main className="min-w-0">

            <div className="overflow-hidden rounded-2xl border border-[#EDE7DC] bg-white shadow-[0_14px_40px_rgba(41,35,29,0.05)]">

              {/* COMPOSER HEADER */}

              <div className="border-b border-[#EDE7DC] px-5 py-5 sm:px-7">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
                      {isExistingCampaign
                        ? "Campaign Editor"
                        : "Campaign Builder"}
                    </p>

                    <h2 className="mt-1 font-serif text-xl text-[#29231D]">
                      {isExistingCampaign
                        ? "Refine your campaign"
                        : "Create your message"}
                    </h2>

                  </div>

                  {initialCampaign && (
                    <div className="text-right">

                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#A89C8D]">
                        Current Stage
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#29231D]">
                        {currentStage?.value ??
                          "Introduction"}
                      </p>

                    </div>
                  )}

                </div>

              </div>

              {/* COMPOSER */}

              <div className="p-5 sm:p-7 lg:p-8">

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

              </div>

            </div>
          </main>

          {/* ====================================================
              RIGHT SIDEBAR
          ==================================================== */}

          <aside className="xl:sticky xl:top-6 xl:self-start">

            <div className="space-y-4">

              {/* WORKFLOW */}

              <div className="rounded-2xl border border-[#EDE7DC] bg-white p-5 shadow-sm">

                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
                  Campaign Workflow
                </p>

                <div className="mt-4 space-y-4">

                  {[
                    {
                      number: "01",
                      title: "Audience",
                      text: "Choose the contacts who should receive this campaign.",
                    },
                    {
                      number: "02",
                      title: "Message",
                      text: "Build the email and apply personalization tokens.",
                    },
                    {
                      number: "03",
                      title: "Review",
                      text: "Preview the campaign before delivery.",
                    },
                    {
                      number: "04",
                      title: "Send",
                      text: "Send the campaign and record delivery history.",
                    },
                  ].map(
                    (item) => (
                      <div
                        key={item.number}
                        className="flex gap-3"
                      >

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF7EF] text-[9px] font-semibold text-[#B7832F]">
                          {item.number}
                        </div>

                        <div>
                          <p className="text-xs font-medium text-[#29231D]">
                            {item.title}
                          </p>

                          <p className="mt-0.5 text-[10px] leading-4 text-[#8F8578]">
                            {item.text}
                          </p>
                        </div>

                      </div>
                    ),
                  )}

                </div>
              </div>

              {/* CAMPAIGN STATUS */}

              {initialCampaign && (
                <div className="rounded-2xl border border-[#EDE7DC] bg-white p-5 shadow-sm">

                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
                    Campaign Status
                  </p>

                  <div className="mt-4">

                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(
                        initialCampaign.status,
                      )}`}
                    >
                      {getStatusLabel(
                        initialCampaign.status,
                      )}
                    </span>

                    <p className="mt-3 text-[10px] leading-5 text-[#8F8578]">
                      {isEditable
                        ? "This campaign can be updated and saved."
                        : "This campaign is being displayed with its saved history and audience."}
                    </p>

                  </div>
                </div>
              )}

              {/* NEXT ACTION */}

              {initialCampaign && (
                <div className="rounded-2xl border border-[#D8B66A]/40 bg-[#B7832F]/5 p-5">

                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B7832F]">
                    Next Recommended Action
                  </p>

                  <p className="mt-3 font-serif text-lg text-[#29231D]">
                    {nextStage
                      ? `Prepare ${nextStage.value}`
                      : "Campaign complete"}
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#7C7265]">
                    {nextStage
                      ? "Continue the campaign sequence when the next outreach is appropriate."
                      : "This campaign has reached the end of its configured journey."}
                  </p>

                </div>
              )}

            </div>
          </aside>

        </div>

      </div>
    </div>
  );
}