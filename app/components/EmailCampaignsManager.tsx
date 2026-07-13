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
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(
    initialCampaigns ?? [],
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [campaignToDelete, setCampaignToDelete] =
    useState<EmailCampaign | null>(null);

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

  async function duplicateCampaign(campaign: EmailCampaign) {
    setDuplicatingId(campaign.id);
    setMessage("");

    try {
      const supabase = createClient();

      // Load the complete original campaign.
      const { data: originalCampaign, error: campaignLoadError } =
        await supabase
          .from("email_campaigns")
          .select(`
            id,
            name,
            subject,
            body,
            template_id,
            recipient_count
          `)
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

      // Create a new draft copy.
      const { data: duplicatedCampaign, error: duplicateError } =
        await supabase
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
          .single();

      if (duplicateError || !duplicatedCampaign) {
        throw new Error(
          `Unable to duplicate campaign: ${
            duplicateError?.message || "Unknown error."
          }`,
        );
      }

      // Load the original recipients.
      const { data: originalRecipients, error: recipientsLoadError } =
        await supabase
          .from("email_campaign_recipients")
          .select(`
            contact_id,
            email,
            first_name,
            last_name
          `)
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

      // Copy recipients to the new campaign.
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

      // Add the duplicate to the screen immediately.
      setCampaigns((current) => [
        duplicatedCampaign as EmailCampaign,
        ...current,
      ]);

      setMessage(
        `Campaign "${campaign.name}" duplicated successfully.`,
      );

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

  async function deleteCampaign() {
    if (!campaignToDelete) {
      setMessage(
        "Unable to delete campaign: No campaign was selected.",
      );
      return;
    }

    const campaign = campaignToDelete;

    setDeletingId(campaign.id);
    setMessage("");

    try {
      const supabase = createClient();

      // Delete associated recipient records first.
      const { error: recipientsError } = await supabase
        .from("email_campaign_recipients")
        .delete()
        .eq("campaign_id", campaign.id);

      if (recipientsError) {
        throw new Error(
          `Unable to delete campaign recipients: ${recipientsError.message}`,
        );
      }

      // Delete the campaign itself.
      const { error: campaignError } = await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", campaign.id)
        .eq("organization_id", organizationId);

      if (campaignError) {
        throw new Error(
          `Unable to delete campaign: ${campaignError.message}`,
        );
      }

      // Remove the campaign from the screen.
      setCampaigns((current) =>
        current.filter((item) => item.id !== campaign.id),
      );

      // Close the modal.
      setCampaignToDelete(null);

      // Show success message.
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

  return (
    <>
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Total Campaigns"
            value={campaigns.length}
          />

          <SummaryCard
            label="Drafts"
            value={
              campaigns.filter(
                (campaign) => campaign.status === "draft",
              ).length
            }
          />

          <SummaryCard
            label="Scheduled"
            value={
              campaigns.filter(
                (campaign) => campaign.status === "scheduled",
              ).length
            }
          />

          <SummaryCard
            label="Sent"
            value={
              campaigns.filter(
                (campaign) => campaign.status === "sent",
              ).length
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
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37] lg:min-w-52"
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Success or error message */}
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
                        {campaign.recipient_count ?? 0}
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

                    <div className="flex flex-wrap gap-2">
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
                        onClick={() => duplicateCampaign(campaign)}
                        disabled={
                          duplicatingId === campaign.id ||
                          deletingId === campaign.id
                        }
                        className="rounded-lg border border-[#444444] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-600 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === campaign.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* RoseVault delete confirmation modal */}
      {campaignToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
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
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#333333] bg-[#151515] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Gold accent */}
            <div className="h-1 bg-[#d4af37]" />

            <div className="p-6 sm:p-8">
              {/* Warning icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-900/50 bg-red-950/30">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-red-400"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.7 17.1A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
                RoseVault Campaigns
              </p>

              <h2
                id="delete-campaign-title"
                className="mt-2 text-2xl font-semibold text-white"
              >
                Permanently delete this campaign?
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                You&apos;re about to permanently delete:
              </p>

              {/* Campaign preview */}
              <div className="mt-4 rounded-xl border border-[#333333] bg-[#0f0f0f] px-5 py-4">
                <p className="font-semibold text-white">
                  {campaignToDelete.name}
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {campaignToDelete.subject || "No subject"}
                </p>

                <p className="mt-3 text-xs text-gray-600">
                  {campaignToDelete.recipient_count ?? 0}{" "}
                  {(campaignToDelete.recipient_count ?? 0) === 1
                    ? "recipient"
                    : "recipients"}
                </p>
              </div>

              {/* Warning */}
              <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
                <p className="text-sm leading-6 text-red-300">
                  This action cannot be undone. The campaign and its
                  associated recipient records will be permanently
                  removed from RoseVault.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingId !== null}
                  className="rounded-lg border border-[#444444] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#666666] hover:bg-[#222222] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={deleteCampaign}
                  disabled={deletingId !== null}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-950/40 px-5 py-3 text-sm font-semibold text-red-300 transition hover:border-red-500 hover:bg-red-900/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
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
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-gray-700 bg-gray-900/50 text-gray-300",
    scheduled:
      "border-blue-900/50 bg-blue-950/30 text-blue-300",
    sending:
      "border-amber-900/50 bg-amber-950/30 text-amber-300",
    sent: "border-green-900/50 bg-green-950/30 text-green-300",
    failed: "border-red-900/50 bg-red-950/30 text-red-300",
    cancelled:
      "border-gray-700 bg-gray-900/50 text-gray-500",
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