import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CampaignHistoryPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function CampaignHistoryPage({
  params,
}: CampaignHistoryPageProps) {
  const { campaignId } = await params;

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

  const { data: membership, error: membershipError } =
    await supabase
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
  // LOAD CAMPAIGN
  // ============================================================

  const { data: campaign, error: campaignError } =
    await supabase
      .from("email_campaigns")
      .select(`
        id,
        name,
        subject,
        body,
        status,
        recipient_count,
        scheduled_for,
        sent_at,
        created_at,
        updated_at
      `)
      .eq("id", campaignId)
      .eq(
        "organization_id",
        membership.organization_id,
      )
      .maybeSingle();

  if (campaignError) {
    console.error(
      "Error loading campaign:",
      campaignError,
    );
  }

  if (!campaign) {
    notFound();
  }

  // ============================================================
  // LOAD SEND HISTORY
  // ============================================================

  const { data: sendHistory, error: historyError } =
    await supabase
      .from("email_campaign_sends")
      .select(`
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
      `)
      .eq(
        "campaign_id",
        campaignId,
      )
      .eq(
        "organization_id",
        membership.organization_id,
      )
      .order("started_at", {
        ascending: false,
      });

  if (historyError) {
    console.error(
      "Error loading campaign send history:",
      historyError,
    );
  }

  const sends =
    sendHistory ?? [];

  // ============================================================
  // CALCULATE CAMPAIGN TOTALS
  // ============================================================

  const totalSends =
    sends.length;

  const totalRecipients =
    sends.reduce(
      (total, send) =>
        total +
        (send.recipient_count ?? 0),
      0,
    );

  const totalSent =
    sends.reduce(
      (total, send) =>
        total +
        (send.sent_count ?? 0),
      0,
    );

  const totalFailed =
    sends.reduce(
      (total, send) =>
        total +
        (send.failed_count ?? 0),
      0,
    );

  const lastSend =
    sends.length > 0
      ? sends[0]
      : null;

  const overallSuccessRate =
    totalRecipients > 0
      ? Math.round(
          (totalSent /
            totalRecipients) *
            100,
        )
      : 0;

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ======================================================
            BACK
        ====================================================== */}

        <Link
          href="/marketing/campaigns"
          className="group inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#916520]"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          >
            ←
          </span>

          Back to Campaigns
        </Link>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                RoseVault Communications
              </p>

              <StatusBadge
                status={campaign.status}
              />

            </div>

            <h1 className="mt-3 truncate font-serif text-3xl font-normal tracking-wide text-[#29231D]">
              {campaign.name}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7265]">
              {campaign.subject ||
                "No subject"}
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href={`/email/compose?campaign=${campaign.id}`}
              className="cursor-pointer rounded-md border border-[#D8B66A]/50 bg-[#B7832F]/5 px-5 py-3 text-xs font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A] hover:bg-[#B7832F]/10 hover:text-[#916520] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              Edit Campaign
            </Link>

          </div>

        </div>

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">

          <SummaryCard
            label="Total Sends"
            value={totalSends}
          />

          <SummaryCard
            label="Recipients"
            value={totalRecipients}
          />

          <SummaryCard
            label="Emails Sent"
            value={totalSent}
          />

          <SummaryCard
            label="Failed"
            value={totalFailed}
          />

          <SummaryCard
            label="Success Rate"
            value={`${overallSuccessRate}%`}
          />

        </div>

        {/* ======================================================
            LAST SEND
        ====================================================== */}

        <section className="mt-8 rounded-xl border border-[#EDE7DC] bg-white/45 p-6 backdrop-blur-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Latest Activity
              </p>

              <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                Last Campaign Send
              </h2>

            </div>

            {lastSend ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                <SmallStat
                  label="Date"
                  value={formatDate(
                    lastSend.started_at,
                  )}
                />

                <SmallStat
                  label="Recipients"
                  value={
                    lastSend.recipient_count
                  }
                />

                <SmallStat
                  label="Sent"
                  value={
                    lastSend.sent_count
                  }
                />

                <SmallStat
                  label="Failed"
                  value={
                    lastSend.failed_count
                  }
                />

              </div>
            ) : (
              <p className="text-sm text-[#8F8578]">
                This campaign has not been sent yet.
              </p>
            )}

          </div>

        </section>

        {/* ======================================================
            SEND HISTORY
        ====================================================== */}

        <section className="mt-8 rounded-xl border border-[#EDE7DC] bg-white/45 backdrop-blur-sm">

          <div className="border-b border-[#EDE7DC] p-6">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Delivery History
            </p>

            <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              Every Campaign Send
            </h2>

            <p className="mt-2 text-xs leading-6 text-[#7C7265]">
              Every time this campaign is sent is recorded
              separately so you can track performance over time.
            </p>

          </div>

          {sends.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <p className="font-serif text-lg text-[#29231D]">
                No send history yet
              </p>

              <p className="mt-2 text-xs text-[#7C7265]">
                Once this campaign is sent, its delivery
                history will appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead>
                  <tr className="border-b border-[#EDE7DC]">

                    <TableHeader>
                      Sent
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Recipients
                    </TableHeader>

                    <TableHeader>
                      Sent
                    </TableHeader>

                    <TableHeader>
                      Failed
                    </TableHeader>

                    <TableHeader>
                      Success
                    </TableHeader>

                    <TableHeader>
                      Completed
                    </TableHeader>

                  </tr>
                </thead>

                <tbody>

                  {sends.map(
                    (send) => {
                      const successRate =
                        send.recipient_count >
                        0
                          ? Math.round(
                              (send.sent_count /
                                send.recipient_count) *
                                100,
                            )
                          : 0;

                      return (
                        <tr
                          key={send.id}
                          className="border-b border-[#EDE7DC] last:border-b-0 transition-colors duration-300 hover:bg-[#FBF7EF]/70"
                        >

                          <TableCell>
                            <div>
                              <p className="text-xs font-medium text-[#29231D]">
                                {formatDate(
                                  send.started_at,
                                )}
                              </p>

                              <p className="mt-1 text-[10px] text-[#A89C8D]">
                                {formatTime(
                                  send.started_at,
                                )}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              status={
                                send.status
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {send.recipient_count}
                          </TableCell>

                          <TableCell>
                            <span className="font-medium text-emerald-700">
                              {send.sent_count}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={
                                send.failed_count >
                                0
                                  ? "font-medium text-red-700"
                                  : "text-[#7C7265]"
                              }
                            >
                              {send.failed_count}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-medium text-[#B7832F]">
                              {successRate}%
                            </span>
                          </TableCell>

                          <TableCell>
                            {send.completed_at
                              ? formatDateTime(
                                  send.completed_at,
                                )
                              : "In progress"}
                          </TableCell>

                        </tr>
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ======================================================
            CAMPAIGN DETAILS
        ====================================================== */}

        <section className="mt-8 rounded-xl border border-[#EDE7DC] bg-white/45 p-6 backdrop-blur-sm">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Campaign Details
          </p>

          <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
            Campaign Information
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Detail
              label="Created"
              value={formatDateTime(
                campaign.created_at,
              )}
            />

            <Detail
              label="Last Updated"
              value={formatDateTime(
                campaign.updated_at,
              )}
            />

            <Detail
              label="Scheduled For"
              value={
                campaign.scheduled_for
                  ? formatDateTime(
                      campaign.scheduled_for,
                    )
                  : "Not scheduled"
              }
            />

            <Detail
              label="Last Sent"
              value={
                campaign.sent_at
                  ? formatDateTime(
                      campaign.sent_at,
                    )
                  : "Never"
              }
            />

          </div>

        </section>

      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm">

      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
      </p>

      <p className="mt-3 font-serif text-2xl font-normal text-[#B7832F]">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// SMALL STAT
// ============================================================

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-[#E3DCD0] bg-white/60 px-4 py-3">

      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#A89C8D]">
        {label}
      </p>

      <p className="mt-1.5 text-xs font-medium text-[#29231D]">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// DETAIL
// ============================================================

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#EDE7DC] bg-white/35 px-4 py-4">

      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#A89C8D]">
        {label}
      </p>

      <p className="mt-2 text-xs font-medium text-[#29231D]">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8F8578]">
      {children}
    </th>
  );
}

// ============================================================
// TABLE CELL
// ============================================================

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#7C7265]">
      {children}
    </td>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    draft:
      "border-[#D8CDBE] bg-white/60 text-[#7C7265]",

    scheduled:
      "border-blue-200 bg-blue-50/70 text-blue-700",

    sending:
      "border-amber-200 bg-amber-50/70 text-amber-700",

    sent:
      "border-emerald-200 bg-emerald-50/70 text-emerald-700",

    partial:
      "border-amber-200 bg-amber-50/70 text-amber-700",

    failed:
      "border-red-200 bg-red-50/70 text-red-700",

    cancelled:
      "border-[#E3DCD0] bg-[#F1ECE4]/70 text-[#A89C8D]",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
        styles[status] ??
        styles.draft
      }`}
    >
      {status}
    </span>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

// ============================================================
// TIME
// ============================================================

function formatTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

// ============================================================
// DATE + TIME
// ============================================================

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}