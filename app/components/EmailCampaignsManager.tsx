"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";



type EmailCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipient_count: number;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;

  campaign_stage: string | null;
  stage_order: number | null;
  last_template_id: string | null;
  last_template_name: string | null;
};

type CampaignSend = {
  id: string;
  campaign_id: string;
  organization_id: string;
  sent_by: string;
  status: "sending" | "sent" | "partial" | "failed";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

type Props = {
  initialCampaigns: EmailCampaign[];
  organizationId: string;
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

function getNextCampaignStage(stageOrder: number | null) {
  if (!stageOrder) {
    return CAMPAIGN_STAGES[0];
  }

  return (
    CAMPAIGN_STAGES.find((stage) => stage.order === stageOrder + 1) ?? null
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Campaigns" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function EmailCampaignsManager({
  initialCampaigns,
  organizationId,
}: Props) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(
    initialCampaigns ?? [],
  );

  const [campaignSends, setCampaignSends] = useState<CampaignSend[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [message, setMessage] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [campaignToDelete, setCampaignToDelete] =
    useState<EmailCampaign | null>(null);

  // ============================================================
  // LOAD CAMPAIGN SEND HISTORY
  // ============================================================

  useEffect(() => {
    async function loadCampaignSendHistory() {
      setLoadingHistory(true);

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("email_campaign_sends")
          .select(
            `
            id,
            campaign_id,
            organization_id,
            sent_by,
            status,
            recipient_count,
            sent_count,
            failed_count,
            started_at,
            completed_at,
            created_at
          `,
          )
          .eq("organization_id", organizationId)
          .order("started_at", {
            ascending: false,
          });

        if (error) {
          console.error("Error loading campaign send history:", error);

          setCampaignSends([]);
          return;
        }

        setCampaignSends((data ?? []) as CampaignSend[]);
      } catch (error) {
        console.error("Unexpected error loading campaign send history:", error);

        setCampaignSends([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadCampaignSendHistory();
  }, [organizationId]);

  // ============================================================
  // GROUP SEND HISTORY BY CAMPAIGN
  // ============================================================

  const sendsByCampaign = useMemo(() => {
    const map = new Map<string, CampaignSend[]>();

    for (const send of campaignSends) {
      const existing = map.get(send.campaign_id) ?? [];

      existing.push(send);

      map.set(send.campaign_id, existing);
    }

    return map;
  }, [campaignSends]);

  // ============================================================
  // CAMPAIGN STATISTICS
  // ============================================================

  const campaignStats = useMemo(() => {
    const map = new Map<
      string,
      {
        totalSends: number;
        lastSend: CampaignSend | null;
        totalSent: number;
        totalFailed: number;
      }
    >();

    for (const campaign of campaigns) {
      const sends = sendsByCampaign.get(campaign.id) ?? [];

      const lastSend = sends.length > 0 ? sends[0] : null;

      map.set(campaign.id, {
        totalSends: sends.length,

        lastSend,

        totalSent: sends.reduce(
          (total, send) => total + (send.sent_count ?? 0),
          0,
        ),

        totalFailed: sends.reduce(
          (total, send) => total + (send.failed_count ?? 0),
          0,
        ),
      });
    }

    return map;
  }, [campaigns, sendsByCampaign]);

  // ============================================================
  // DASHBOARD SUMMARY
  // ============================================================

  const dashboardStats = useMemo(() => {
    const totalCampaigns = campaigns.length;

    const drafts = campaigns.filter(
      (campaign) => campaign.status === "draft",
    ).length;

    const scheduled = campaigns.filter(
      (campaign) => campaign.status === "scheduled",
    ).length;

    const sentCampaigns = campaigns.filter(
      (campaign) => campaign.status === "sent",
    ).length;

    const totalEmailsSent = campaignSends.reduce(
      (total, send) => total + (send.sent_count ?? 0),
      0,
    );

    const totalEmailsFailed = campaignSends.reduce(
      (total, send) => total + (send.failed_count ?? 0),
      0,
    );

    const latestSend = campaignSends.length > 0 ? campaignSends[0] : null;

    return {
      totalCampaigns,
      drafts,
      scheduled,
      sentCampaigns,
      totalEmailsSent,
      totalEmailsFailed,
      latestSend,
    };
  }, [campaigns, campaignSends]);

  // ============================================================
  // FILTER CAMPAIGNS
  // ============================================================

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const campaignName = campaign.name?.toLowerCase() ?? "";

      const campaignSubject = campaign.subject?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        campaignName.includes(query) ||
        campaignSubject.includes(query);

      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  // ============================================================
  // DUPLICATE CAMPAIGN
  // ============================================================

  async function duplicateCampaign(campaign: EmailCampaign) {
    setDuplicatingId(campaign.id);

    setMessage("");

    try {
      const supabase = createClient();

      // Load complete original campaign.
      const { data: originalCampaign, error: campaignLoadError } =
        await supabase
          .from("email_campaigns")
          .select(
            `
          id,
          name,
          subject,
          body,
          template_id,
          recipient_count
        `,
          )
          .eq("id", campaign.id)
          .eq("organization_id", organizationId)
          .single();

      if (campaignLoadError || !originalCampaign) {
        throw new Error(
          `Unable to load campaign: ${
            campaignLoadError?.message || "Campaign not found."
          }`,
        );
      }

      // Create new draft copy.
      const { data: duplicatedCampaign, error: duplicateError } = await supabase
        .from("email_campaigns")
        .insert({
          organization_id: organizationId,

          name: `${originalCampaign.name} - Copy`,

          subject: originalCampaign.subject,

          body: originalCampaign.body,

          template_id: originalCampaign.template_id,

          status: "draft",

          recipient_count: originalCampaign.recipient_count ?? 0,
        })
        .select(
          `
          id,
          name,
          subject,
          status,
          recipient_count,
          scheduled_for,
          sent_at,
          created_at,
          updated_at
        `,
        )
        .single();

      if (duplicateError || !duplicatedCampaign) {
        throw new Error(
          `Unable to duplicate campaign: ${
            duplicateError?.message || "Unknown error."
          }`,
        );
      }

      // Load original recipients.
      const { data: originalRecipients, error: recipientsLoadError } =
        await supabase
          .from("email_campaign_recipients")
          .select(
            `
          contact_id,
          email,
          first_name,
          last_name
        `,
          )
          .eq("campaign_id", campaign.id);

      if (recipientsLoadError) {
        await supabase
          .from("email_campaigns")
          .delete()
          .eq("id", duplicatedCampaign.id)
          .eq("organization_id", organizationId);

        throw new Error(
          `Unable to duplicate recipients: ${recipientsLoadError.message}`,
        );
      }

      // Copy recipients.
      if (originalRecipients && originalRecipients.length > 0) {
        const duplicatedRecipients = originalRecipients.map((recipient) => ({
          campaign_id: duplicatedCampaign.id,

          contact_id: recipient.contact_id,

          email: recipient.email,

          first_name: recipient.first_name,

          last_name: recipient.last_name,

          status: "pending",
        }));

        const { error: recipientsInsertError } = await supabase
          .from("email_campaign_recipients")
          .insert(duplicatedRecipients);

        if (recipientsInsertError) {
          await supabase
            .from("email_campaigns")
            .delete()
            .eq("id", duplicatedCampaign.id)
            .eq("organization_id", organizationId);

          throw new Error(
            `Unable to duplicate recipients: ${recipientsInsertError.message}`,
          );
        }
      }

      // Add duplicate immediately.
      setCampaigns((current) => [
        duplicatedCampaign as EmailCampaign,
        ...current,
      ]);

      setMessage(`Campaign "${campaign.name}" duplicated successfully.`);

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to duplicate campaign due to an unknown error.";

      setMessage(errorMessage);
    } finally {
      setDuplicatingId(null);
    }
  }

  // ============================================================
  // DELETE CAMPAIGN
  // ============================================================

  async function deleteCampaign() {
    if (!campaignToDelete) {
      setMessage("Unable to delete campaign: No campaign was selected.");

      return;
    }

    const campaign = campaignToDelete;

    setDeletingId(campaign.id);

    setMessage("");

    try {
      const supabase = createClient();

      // Delete recipient records.
      const { error: recipientsError } = await supabase
        .from("email_campaign_recipients")
        .delete()
        .eq("campaign_id", campaign.id);

      if (recipientsError) {
        throw new Error(
          `Unable to delete campaign recipients: ${recipientsError.message}`,
        );
      }

      // Delete campaign.
      const { error: campaignError } = await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", campaign.id)
        .eq("organization_id", organizationId);

      if (campaignError) {
        throw new Error(`Unable to delete campaign: ${campaignError.message}`);
      }

      // Remove campaign from screen.
      setCampaigns((current) =>
        current.filter((item) => item.id !== campaign.id),
      );

      // Remove send history from local state.
      setCampaignSends((current) =>
        current.filter((send) => send.campaign_id !== campaign.id),
      );

      setCampaignToDelete(null);

      setMessage(
        `Campaign "${campaign.name}" was permanently deleted successfully.`,
      );

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to delete campaign due to an unknown error.";

      setMessage(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }

  function closeDeleteModal() {
    if (deletingId) {
      return;
    }

    setCampaignToDelete(null);
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="space-y-6">
        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <SummaryCard
            label="Total Campaigns"
            value={dashboardStats.totalCampaigns}
          />

          <SummaryCard label="Drafts" value={dashboardStats.drafts} />

          <SummaryCard label="Scheduled" value={dashboardStats.scheduled} />

          <SummaryCard
            label="Sent Campaigns"
            value={dashboardStats.sentCampaigns}
          />

          <SummaryCard
            label="Emails Sent"
            value={dashboardStats.totalEmailsSent}
          />

          <SummaryCard
            label="Emails Failed"
            value={dashboardStats.totalEmailsFailed}
          />
        </div>

        {/* ======================================================
            LAST SEND SUMMARY
        ====================================================== */}

        <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Delivery Intelligence
              </p>

              <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                Campaign Activity
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
                Track your most recent email activity and overall delivery
                performance.
              </p>
            </div>

            <div className="rounded-lg border border-[#E3DCD0] bg-white/60 px-5 py-4 text-left sm:min-w-64">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                Last Email Sent
              </p>

              <p className="mt-2 font-serif text-lg text-[#29231D]">
                {dashboardStats.latestSend
                  ? formatDateTime(dashboardStats.latestSend.started_at)
                  : "No email sent yet"}
              </p>

              {dashboardStats.latestSend && (
                <p className="mt-1 text-[10px] text-[#8F8578]">
                  {dashboardStats.latestSend.sent_count} sent ·{" "}
                  {dashboardStats.latestSend.failed_count} failed
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-5 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Campaign Library
            </p>

            <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              Find a Campaign
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
              Search your saved campaigns or filter them by delivery status.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaigns..."
              className="flex-1 rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10 lg:min-w-52"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ======================================================
            MESSAGE
        ====================================================== */}

        {message && (
          <div
            className={`rounded-md border px-4 py-3 text-xs leading-relaxed ${
              message.toLowerCase().includes("unable")
                ? "border-red-200 bg-red-50/70 text-red-700"
                : "border-emerald-200 bg-emerald-50/70 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* ======================================================
            LOADING HISTORY
        ====================================================== */}

        {loadingHistory && (
          <div className="rounded-md border border-[#EDE7DC] bg-white/40 px-4 py-3 text-xs text-[#7C7265]">
            Loading campaign delivery history...
          </div>
        )}

        {/* ======================================================
            CAMPAIGN LIBRARY
        ====================================================== */}

        {filteredCampaigns.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 px-6 py-16 text-center backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              RoseVault Communications
            </p>

            <h2 className="mt-3 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              {campaigns.length === 0
                ? "No campaigns yet"
                : "No campaigns match your filters"}
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-[#7C7265]">
              {campaigns.length === 0
                ? "Create your first email campaign, select recipients, personalize your message, and save it as a draft."
                : "Try changing your search or status filter."}
            </p>

            {campaigns.length === 0 && (
              <Link
                href="/email/compose"
                className="mt-6 inline-block cursor-pointer rounded-md bg-[#0D0C0A] px-5 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
              >
                Create First Campaign
              </Link>
            )}
          </section>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => {
              const stats = campaignStats.get(campaign.id);

              const lastSend = stats?.lastSend ?? null;

              const totalSends = stats?.totalSends ?? 0;

              const sentCount = lastSend?.sent_count ?? 0;

              const failedCount = lastSend?.failed_count ?? 0;

              

              const successRate =
                lastSend && lastSend.recipient_count > 0
                  ? Math.round(
                      (lastSend.sent_count / lastSend.recipient_count) * 100,
                    )
                  : null;

              return (
                <article
                  key={campaign.id}
                  className="group rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-5">
                    {/* ==================================================
                          TOP ROW
                      ================================================== */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* Campaign Identity */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status={campaign.status} />

                          {totalSends > 0 && (
                            <span className="rounded-full border border-[#D8B66A]/40 bg-[#B7832F]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
                              {totalSends} {totalSends === 1 ? "Send" : "Sends"}
                            </span>
                          )}

                          <span className="text-[10px] font-medium tracking-wide text-[#A89C8D]">
                            Updated {formatDate(campaign.updated_at)}
                          </span>
                        </div>

                        <h2 className="mt-3 truncate font-serif text-lg font-medium tracking-wide text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
                          {campaign.name}
                        </h2>

                        <p className="mt-1 truncate text-xs text-[#8F8578]">
                          {campaign.subject || "No subject"}
                        </p>
                      </div>

                      {/* ==================================================
                            ACTIONS
                        ================================================== */}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/email/compose?campaign=${campaign.id}`}
                          className="cursor-pointer rounded-md border border-[#D8B66A]/50 bg-[#B7832F]/5 px-4 py-2 text-[10px] font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A] hover:bg-[#B7832F]/10 hover:text-[#916520] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/marketing/campaigns/${campaign.id}`}
                          className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
                        >
                          History
                        </Link>

                        <button
                          type="button"
                          onClick={() => duplicateCampaign(campaign)}
                          disabled={
                            duplicatingId === campaign.id ||
                            deletingId === campaign.id
                          }
                          className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {duplicatingId === campaign.id
                            ? "Duplicating..."
                            : "Duplicate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCampaignToDelete(campaign)}
                          disabled={
                            deletingId === campaign.id ||
                            duplicatingId === campaign.id
                          }
                          className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#8F8578] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === campaign.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    {/* ==================================================
                          CAMPAIGN PROGRESSION
                      ================================================== */}

                    {(() => {
  const lastStage =
    CAMPAIGN_STAGES.find(
      (stage) => stage.order === campaign.stage_order,
    ) ??
    CAMPAIGN_STAGES.find(
      (stage) => stage.value === campaign.campaign_stage,
    ) ??
    CAMPAIGN_STAGES[0];

  const nextStage = getNextCampaignStage(
    lastStage.order,
  );

  return (
    <div className="space-y-3 border-t border-[#EDE7DC] pt-4">

      {/* ==================================================
            STAGE / TEMPLATE ROW
        ================================================== */}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

        {/* LAST STAGE */}

        <div className="rounded-lg border border-[#E3DCD0] bg-white/60 p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
            Last Stage
          </p>

          <p className="mt-1 font-serif text-sm text-[#29231D]">
            {lastStage.value}
          </p>

          <p className="mt-1 text-[10px] text-[#8F8578]">
            Stage {lastStage.order} of{" "}
            {CAMPAIGN_STAGES.length}
          </p>
        </div>

        {/* NEXT STAGE */}

        <div className="rounded-lg border border-[#D8B66A]/40 bg-[#B7832F]/5 p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#B7832F]">
            Next Stage
          </p>

          <p className="mt-1 font-serif text-sm text-[#29231D]">
            {nextStage
              ? nextStage.value
              : "Campaign Complete"}
          </p>

          <p className="mt-1 text-[10px] text-[#8F8578]">
            {nextStage
              ? `Stage ${nextStage.order} of ${CAMPAIGN_STAGES.length}`
              : "No further outreach"}
          </p>
        </div>

        {/* LAST TEMPLATE */}

        <div className="rounded-lg border border-[#E3DCD0] bg-white/60 p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
            Last Template Sent
          </p>

          <p className="mt-1 truncate font-serif text-sm text-[#29231D]">
            {campaign.last_template_name ??
              "No template sent yet"}
          </p>

          <p className="mt-1 text-[10px] text-[#8F8578]">
            {campaign.sent_at
              ? formatDate(campaign.sent_at)
              : "Not sent yet"}
          </p>
        </div>
      </div>

      {/* ==================================================
            DELIVERY METRICS
        ================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

        <Metric
          label="Recipients"
          value={campaign.recipient_count ?? 0}
        />

        <Metric
          label="Last Sent"
          value={
            lastSend
              ? formatDate(lastSend.started_at)
              : "Never"
          }
        />

        <Metric
          label="Last Sent Count"
          value={lastSend ? sentCount : "—"}
        />

        <Metric
          label="Failed"
          value={lastSend ? failedCount : "—"}
        />

        <Metric
          label="Success Rate"
          value={
            successRate !== null
              ? `${successRate}%`
              : "—"
          }
        />

        <Metric
          label="Total Sends"
          value={totalSends}
        />
      </div>
    </div>
  );
})()}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}

      {campaignToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0C0A]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-campaign-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-[#D8B66A]/30 bg-[#F8F4EC] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="h-1 bg-[#D8B66A]" />

            <div className="p-6 sm:p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.7 17.1A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                RoseVault Campaigns
              </p>

              <h2
                id="delete-campaign-title"
                className="mt-2 font-serif text-2xl font-normal tracking-wide text-[#29231D]"
              >
                Permanently delete this campaign?
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#7C7265]">
                You&apos;re about to permanently delete:
              </p>

              <div className="mt-4 rounded-xl border border-[#E3DCD0] bg-white/60 px-5 py-4">
                <p className="font-serif text-sm font-medium tracking-wide text-[#29231D]">
                  {campaignToDelete.name}
                </p>

                <p className="mt-1 truncate text-xs text-[#8F8578]">
                  {campaignToDelete.subject || "No subject"}
                </p>

                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#A89C8D]">
                  {campaignToDelete.recipient_count ?? 0}{" "}
                  {(campaignToDelete.recipient_count ?? 0) === 1
                    ? "recipient"
                    : "recipients"}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
                <p className="text-xs leading-6 text-red-700">
                  This action cannot be undone. The campaign and its associated
                  recipient records will be permanently removed from RoseVault.
                </p>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingId !== null}
                  className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={deleteCampaign}
                  disabled={deletingId !== null}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-5 py-3 text-xs font-medium tracking-wide text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100 hover:text-red-800 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 0 0 8-8v4a4 4 0 0 0-4 4H4Z"
                        />
                      </svg>
                      Deleting Campaign...
                    </>
                  ) : (
                    "Permanently Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="group rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
      </p>

      <p className="mt-3 font-serif text-3xl font-normal text-[#B7832F]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[#EDE7DC] bg-white/35 px-3 py-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#A89C8D]">
        {label}
      </p>

      <p className="mt-1.5 truncate text-xs font-medium text-[#29231D]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-[#D8CDBE] bg-white/60 text-[#7C7265]",

    scheduled: "border-blue-200 bg-blue-50/70 text-blue-700",

    sending: "border-amber-200 bg-amber-50/70 text-amber-700",

    sent: "border-emerald-200 bg-emerald-50/70 text-emerald-700",

    partial: "border-amber-200 bg-amber-50/70 text-amber-700",

    failed: "border-red-200 bg-red-50/70 text-red-700",

    cancelled: "border-[#E3DCD0] bg-[#F1ECE4]/70 text-[#A89C8D]",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// ============================================================
// DATE + TIME
// ============================================================

function formatDateTime(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
