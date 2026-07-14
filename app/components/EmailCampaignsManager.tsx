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
        {/* Summary Cards */}
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
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10 lg:min-w-52"
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

        {/* Success or Error Message */}
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

        {/* Campaign Library */}
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
            {filteredCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="group rounded-xl border border-[#EDE7DC] bg-white/45 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* Campaign Identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={campaign.status} />

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

                  {/* Campaign Details & Actions */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                    <div className="min-w-20">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                        Recipients
                      </p>

                      <p className="mt-1.5 font-serif text-lg font-medium text-[#29231D]">
                        {campaign.recipient_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-28">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                        Created
                      </p>

                      <p className="mt-1.5 text-xs text-[#7C7265]">
                        {formatDate(campaign.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {campaign.status === "draft" && (
                        <Link
                          href={`/email/compose?campaign=${campaign.id}`}
                          className="cursor-pointer rounded-md border border-[#D8B66A]/50 bg-[#B7832F]/5 px-4 py-2 text-[10px] font-medium tracking-wide text-[#B7832F] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A] hover:bg-[#B7832F]/10 hover:text-[#916520] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
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
                        className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-[#E3DCD0] disabled:hover:bg-white/60 disabled:hover:text-[#7C7265] disabled:hover:shadow-none"
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
                        className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-2 text-[10px] font-medium tracking-wide text-[#8F8578] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-[#E3DCD0] disabled:hover:bg-white/60 disabled:hover:text-[#8F8578] disabled:hover:shadow-none"
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

      {/* RoseVault Delete Confirmation Modal */}
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
            {/* Gold Accent */}
            <div className="h-1 bg-[#D8B66A]" />

            <div className="p-6 sm:p-8">
              {/* Warning Icon */}
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

              {/* Campaign Preview */}
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

              {/* Warning */}
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
                <p className="text-xs leading-6 text-red-700">
                  This action cannot be undone. The campaign and its associated
                  recipient records will be permanently removed from RoseVault.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingId !== null}
                  className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={deleteCampaign}
                  disabled={deletingId !== null}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-5 py-3 text-xs font-medium tracking-wide text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100 hover:text-red-800 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft:
      "border-[#D8CDBE] bg-white/60 text-[#7C7265]",
    scheduled:
      "border-blue-200 bg-blue-50/70 text-blue-700",
    sending:
      "border-amber-200 bg-amber-50/70 text-amber-700",
    sent:
      "border-emerald-200 bg-emerald-50/70 text-emerald-700",
    failed:
      "border-red-200 bg-red-50/70 text-red-700",
    cancelled:
      "border-[#E3DCD0] bg-[#F1ECE4]/70 text-[#A89C8D]",
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