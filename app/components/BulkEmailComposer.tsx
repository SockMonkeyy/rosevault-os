"use client";

import { useMemo, useState, useTransition } from "react";
import RecipientSelector from "./email/BulkEmailComposer/RecipientSelector";
import { sendCampaign } from "@/app/actions/email/sendCampaign";
import { saveCampaignDraft } from "@/app/actions/email/saveCampaignDraft";
import {
  Contact,
  EmailTemplate,
  InitialCampaign,
} from "./email/BulkEmailComposer/types";

const VARIABLES = [
  "{{first_name}}",
  "{{last_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{mailing_address}}",
  "{{property_address}}",
];

type Props = {
  contacts: Contact[];
  templates: EmailTemplate[];
  initialSelectedContactIds?: string[];
  organizationId: string;
  userId: string;
  initialCampaign?: InitialCampaign | null;
};

export default function BulkEmailComposer({
  contacts,
  templates,
  initialSelectedContactIds = [],
  organizationId,
  userId,
  initialCampaign = null,
}: Props) {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    initialSelectedContactIds.filter((id) =>
      contacts.some((contact) => contact.id === id),
    ),
  );

  const [campaign, setCampaign] = useState<InitialCampaign | null>(
    initialCampaign,
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    campaign?.template_id ?? "",
  );

  const [subject, setSubject] = useState(campaign?.subject ?? "");

  const [body, setBody] = useState(campaign?.body ?? "");

  const [search, setSearch] = useState("");

  const [previewContactId, setPreviewContactId] = useState("");
  const [campaignName, setCampaignName] = useState(campaign?.name ?? "");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  const [isSending, startTransition] = useTransition();

  const skippedInitialContactCount =
    initialSelectedContactIds.length -
    initialSelectedContactIds.filter((id) =>
      contacts.some((contact) => contact.id === id),
    ).length;

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const fullName = [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(query) ||
        (contact.email ?? "").toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedContactIds.includes(contact.id)),
    [contacts, selectedContactIds],
  );

  const previewContact =
    selectedContacts.find((contact) => contact.id === previewContactId) ??
    selectedContacts[0] ??
    null;

  function toggleContact(contactId: string) {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  }

  function selectAllFiltered() {
    const filteredIds = filteredContacts.map((contact) => contact.id);

    setSelectedContactIds((current) =>
      Array.from(new Set([...current, ...filteredIds])),
    );
  }

  function clearSelection() {
    setSelectedContactIds([]);
    setPreviewContactId("");
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);

    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    setSubject(template.subject);
    setBody(template.body);
  }

  function insertVariable(variable: string) {
    setBody((current) => `${current}${variable}`);
  }

  async function saveDraft() {
    if (!campaignName.trim()) {
      setDraftMessage("Enter a campaign name before saving.");
      return;
    }

    if (selectedContacts.length === 0) {
      setDraftMessage("Select at least one recipient before saving.");
      return;
    }

    try {
      setIsSavingDraft(true);
      setDraftMessage("");

      const savedCampaign = await saveCampaignDraft({
        campaignId: campaign?.id,
        organizationId,
        userId,
        campaignName,
        subject,
        body,
        templateId: selectedTemplateId || undefined,
        recipients: selectedContacts.map((r) => ({
          contactId: r.id,
          email: r.email ?? "",
          firstName: r.first_name,
          lastName: r.last_name,
        })),
      });

      // Update local component state so subsequent saves act as updates
      setCampaign(savedCampaign);
      setDraftMessage(
        campaign
          ? "Campaign draft updated successfully."
          : "Campaign draft saved successfully.",
      );

      setTimeout(() => {
        setDraftMessage("");
      }, 5000);
    } catch (error) {
      console.error(error);
      setDraftMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the campaign draft.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleSendCampaign() {
    if (!campaign) {
      setDraftMessage("Please save the campaign as a draft before sending.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendCampaign(campaign.id);

        setDraftMessage(
          `Campaign sent successfully. ${result.sent} emails sent.${result.failed > 0 ? ` ${result.failed} failed.` : ""}`,
        );
      } catch (error) {
        setDraftMessage(
          error instanceof Error ? error.message : "Unable to send campaign.",
        );
      }
    });
  }

  const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-6 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0D0C0A] disabled:hover:text-[#D8B66A] disabled:hover:shadow-none";

  function formatAddress(
    line1: string | null,
    line2: string | null,
    city: string | null,
    state: string | null,
    postalCode: string | null,
  ): string {
    return [line1, line2, [city, state, postalCode].filter(Boolean).join(", ")]
      .filter(Boolean)
      .join("\n");
  }

  function renderPreviewBody(
    body: string,
    previewContact: Contact,
  ): import("react").ReactNode {
    if (!body) return null;

    const replacements: Record<string, string> = {
      "{{first_name}}": previewContact.first_name ?? "",
      "{{last_name}}": previewContact.last_name ?? "",
      "{{full_name}}": [previewContact.first_name, previewContact.last_name]
        .filter(Boolean)
        .join(" "),
      "{{email}}": previewContact.email ?? "",
      "{{mailing_address}}": formatAddress(
        previewContact.mailing_address_line_1,
        previewContact.mailing_address_line_2,
        previewContact.mailing_city,
        previewContact.mailing_state,
        previewContact.mailing_postal_code,
      ),
      "{{property_address}}": formatAddress(
        previewContact.property_address_line_1,
        previewContact.property_address_line_2,
        previewContact.property_city,
        previewContact.property_state,
        previewContact.property_postal_code,
      ),
    };

    let processed = body;

    for (const key of Object.keys(replacements)) {
      processed = processed.split(key).join(replacements[key]);
    }

    return (
      <div className="whitespace-pre-wrap text-sm text-[#29231D]">
        {processed}
      </div>
    );
  }

  return (
    <>
      {/* Initial Contact Warning */}
      {skippedInitialContactCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4">
          <p className="text-xs leading-relaxed text-amber-700">
            {skippedInitialContactCount} selected contact
            {skippedInitialContactCount === 1 ? "" : "s"} could not be added
            because no email address is available.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(340px,0.7fr)_minmax(0,1.3fr)]">
        {/* Recipients */}
        <RecipientSelector
          contacts={contacts}
          filteredContacts={filteredContacts}
          selectedContactIds={selectedContactIds}
          search={search}
          inputClasses={inputClasses}
          secondaryButtonClasses={secondaryButtonClasses}
          onSearchChange={setSearch}
          onToggleContact={toggleContact}
          onSelectAll={selectAllFiltered}
          onClearSelection={clearSelection}
        />

        {/* Composer Column */}
        <div className="space-y-6">
          {/* Compose */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                Correspondence
              </p>

              <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                Create Your Message
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
                Compose a personalized email for the contacts you&apos;ve
                selected.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClasses}>Email Template</label>

                <select
                  value={selectedTemplateId}
                  onChange={(event) => applyTemplate(event.target.value)}
                  className={inputClasses}
                >
                  <option value="">Start without a template</option>

                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Subject</label>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter email subject..."
                  className={inputClasses}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Message
                  </label>

                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A89C8D]">
                    Personalization Supported
                  </span>
                </div>

                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={16}
                  placeholder={`Hi {{first_name}},\n\nWrite your message here...`}
                  className={`${inputClasses} resize-y leading-7`}
                />

                <div className="mt-4">
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                    Insert Personalization
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="cursor-pointer rounded-full border border-[#E3DCD0] bg-white/60 px-3 py-1.5 text-[10px] font-medium text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                  Recipient View
                </p>

                <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                  Personalized Email Preview
                </h2>
              </div>

              {selectedContacts.length > 0 && (
                <select
                  value={previewContact?.id ?? ""}
                  onChange={(event) => setPreviewContactId(event.target.value)}
                  className="rounded-md border border-[#E3DCD0] bg-white/70 px-3 py-2 text-xs text-[#29231D] outline-none transition-all duration-300 hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:ring-2 focus:ring-[#D8B66A]/10"
                >
                  {selectedContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {[contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Contact"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!previewContact ? (
              <div className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 p-8 text-center">
                <p className="font-serif text-sm text-[#29231D]">
                  No recipient selected
                </p>

                <p className="mt-1 text-xs text-[#8F8578]">
                  Select at least one contact to preview personalization.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#E3DCD0] bg-white/70 shadow-sm">
                <div className="border-b border-[#EDE7DC] px-5 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                    To
                  </p>

                  <p className="mt-1.5 text-xs text-[#5F574D]">
                    {previewContact.email}
                  </p>
                </div>

                <div className="border-b border-[#EDE7DC] px-5 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                    Subject
                  </p>
                  <p className="mt-1.5 text-xs text-[#5F574D] truncate">
                    {subject || "(No subject)"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D]">
                    Message
                  </p>

                  <div className="mt-1.5 text-xs text-[#5F574D] whitespace-pre-wrap">
                    {renderPreviewBody(body, previewContact)}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Campaign Actions */}
          <section className="rounded-xl border border-[#D8B66A]/35 bg-[#B7832F]/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#D8B66A]/50 hover:bg-[#B7832F]/[0.07] lg:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
                  Campaign
                </p>

                <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
                  {campaign
                    ? "Update or Send Campaign"
                    : "Save or Send Campaign"}
                </h2>

                <p className="mt-2 text-xs leading-6 text-[#7C7265]">
                  {selectedContactIds.length} recipient
                  {selectedContactIds.length === 1 ? "" : "s"} selected.
                </p>
              </div>

              <div>
                <label className={labelClasses}>Campaign Name</label>

                <input
                  type="text"
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder="Example: July Seller Follow-Up"
                  className={inputClasses}
                />
              </div>

              {draftMessage && (
                <div
                  className={`rounded-md border px-4 py-3 text-xs leading-relaxed ${
                    draftMessage.toLowerCase().includes("success")
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
                      : "border-amber-200 bg-amber-50/70 text-amber-700"
                  }`}
                >
                  {draftMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={isSavingDraft}
                  className={primaryButtonClasses}
                >
                  {isSavingDraft
                    ? campaign
                      ? "Updating Draft..."
                      : "Saving Draft..."
                    : campaign
                      ? "Update Draft"
                      : "Save as Draft"}
                </button>

                <button
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={isSending || !campaign}
                  className={primaryButtonClasses}
                >
                  {isSending ? "Sending..." : "Send Campaign"}
                </button>
              </div>

              <p className="text-[10px] leading-5 text-[#A89C8D]">
                Each selected recipient will receive a personalized email using
                the active campaign.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}