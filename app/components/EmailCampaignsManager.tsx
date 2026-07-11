"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
};

type Props = {
  initialCampaigns: EmailCampaign[];
  organizationId: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Campaigns" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function EmailCampaignsManager({
  initialCampaigns,
  organizationId,
}: Props) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(initialCampaigns);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

const [message, setMessage] = useState("");
const [deletingId, setDeletingId] = useState<string | null>(null);

const [campaignToDelete, setCampaignToDelete] =
  useState<EmailCampaign | null>(null);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch =
        !query ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.subject.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  async function deleteCampaign(campaign: EmailCampaign) {
    if (!confirmed) {
      return;
    }

    setDeletingId(campaign.id);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", campaign.id)
      .eq("organization_id", organizationId);

    if (error) {
      setMessage(`Unable to delete campaign: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setCampaigns((current) =>
      current.filter((item) => item.id !== campaign.id),
    );

    setMessage(`Campaign "${campaign.name}" permanently deleted.`);
    setDeletingId(null);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Campaigns" value={campaigns.length} />

        <SummaryCard
          label="Drafts"
          value={
            campaigns.filter((campaign) => campaign.status === "draft").length
          }
        />

        <SummaryCard
          label="Scheduled"
          value={
            campaigns.filter((campaign) => campaign.status === "scheduled")
              .length
          }
        />

        <SummaryCard
          label="Sent"
          value={
            campaigns.filter((campaign) => campaign.status === "sent").length
          }
        />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search campaigns..."
            className="flex-1 rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37] lg:min-w-52"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {message && (
        <div
          className={`rounded-xl border px-5 py-4 text-sm ${
            message.toLowerCase().includes("unable")
              ? "border-red-900/40 bg-red-950/20 text-red-300"
              : "border-green-900/40 bg-green-950/20 text-green-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Campaign library */}
      {filteredCampaigns.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#333333] bg-[#151515] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-white">
            {campaigns.length === 0
              ? "No campaigns yet"
              : "No campaigns match your filters"}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
            {campaigns.length === 0
              ? "Create your first email campaign, select recipients, personalize your message, and save it as a draft."
              : "Try changing your search or status filter."}
          </p>

          {campaigns.length === 0 && (
            <Link
              href="/email/compose"
              className="mt-6 inline-block rounded-lg bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
            >
              Create First Campaign
            </Link>
          )}
        </section>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5 transition hover:border-[#3a3a3a]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={campaign.status} />

                    <span className="text-xs text-gray-600">
                      Updated {formatDate(campaign.updated_at)}
                    </span>
                  </div>

                  <h2 className="mt-3 truncate text-lg font-semibold text-white">
                    {campaign.name}
                  </h2>

                  <p className="mt-1 truncate text-sm text-gray-500">
                    {campaign.subject || "No subject"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-600">
                      Recipients
                    </p>

                    <p className="mt-1 font-medium text-white">
                      {campaign.recipient_count}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-600">
                      Created
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                      {formatDate(campaign.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {campaign.status === "draft" && (
                      <Link
                        href={`/email/compose?campaign=${campaign.id}`}
                        className="rounded-lg border border-[#d4af37]/50 px-4 py-2 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10"
                      >
                        Edit
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => setCampaignToDelete(campaign)}
                      disabled={deletingId === campaign.id}
                      className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-600 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>

      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-gray-700 bg-gray-900/50 text-gray-300",
    scheduled: "border-blue-900/50 bg-blue-950/30 text-blue-300",
    sending: "border-amber-900/50 bg-amber-950/30 text-amber-300",
    sent: "border-green-900/50 bg-green-950/30 text-green-300",
    failed: "border-red-900/50 bg-red-950/30 text-red-300",
    cancelled: "border-gray-700 bg-gray-900/50 text-gray-500",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
