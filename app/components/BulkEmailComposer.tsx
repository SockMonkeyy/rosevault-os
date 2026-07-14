"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;

  mailing_address_line_1: string | null;
  mailing_address_line_2: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_postal_code: string | null;

  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
};

type InitialCampaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_id: string | null;
  status: string;
};

type Props = {
  contacts: Contact[];
  templates: EmailTemplate[];
  initialSelectedContactIds?: string[];
  organizationId: string;
  userId: string;
  initialCampaign?: InitialCampaign | null;
};

const VARIABLES = [
  "{{first_name}}",
  "{{last_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{mailing_address}}",
  "{{property_address}}",
];

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

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialCampaign?.template_id ?? "",
  );

  const [subject, setSubject] = useState(initialCampaign?.subject ?? "");

  const [body, setBody] = useState(initialCampaign?.body ?? "");

  const [search, setSearch] = useState("");

  const [previewContactId, setPreviewContactId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

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

  const personalizedSubject = previewContact
    ? personalizeText(subject, previewContact)
    : subject;

  const personalizedBody = previewContact
    ? personalizeText(body, previewContact)
    : body;

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

    setIsSavingDraft(true);
    setDraftMessage("");

    const supabase = createClient();

    const campaignPayload = {
      organization_id: organizationId,
      name: campaignName.trim(),
      subject: subject.trim(),
      body,
      template_id: selectedTemplateId || null,
      status: "draft",
      recipient_count: selectedContacts.length,
    };

    if (initialCampaign) {
      const { error: updateError } = await supabase
        .from("email_campaigns")
        .update(campaignPayload)
        .eq("id", initialCampaign.id)
        .eq("organization_id", organizationId);

      if (updateError) {
        setDraftMessage(
          `Unable to update campaign: ${updateError.message}`,
        );
        setIsSavingDraft(false);
        return;
      }

      const { error: deleteRecipientsError } = await supabase
        .from("email_campaign_recipients")
        .delete()
        .eq("campaign_id", initialCampaign.id);

      if (deleteRecipientsError) {
        setDraftMessage(
          `Campaign details were updated, but recipients could not be refreshed: ${deleteRecipientsError.message}`,
        );
        setIsSavingDraft(false);
        return;
      }

      const recipients = selectedContacts
        .filter((contact) => contact.email)
        .map((contact) => ({
          campaign_id: initialCampaign.id,
          contact_id: contact.id,
          email: contact.email as string,
          first_name: contact.first_name || null,
          last_name: contact.last_name || null,
          status: "pending",
        }));

      const { error: recipientsError } = await supabase
        .from("email_campaign_recipients")
        .insert(recipients);

      if (recipientsError) {
        setDraftMessage(
          `Campaign details were updated, but recipients could not be saved: ${recipientsError.message}`,
        );
        setIsSavingDraft(false);
        return;
      }

      setDraftMessage("Campaign draft updated successfully.");
      setIsSavingDraft(false);

      setTimeout(() => {
        setDraftMessage("");
      }, 5000);

      return;
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        ...campaignPayload,
        created_by: userId,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      setDraftMessage(
        campaignError?.message ||
          "Unable to save the campaign draft.",
      );
      setIsSavingDraft(false);
      return;
    }

    const recipients = selectedContacts
      .filter((contact) => contact.email)
      .map((contact) => ({
        campaign_id: campaign.id,
        contact_id: contact.id,
        email: contact.email as string,
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        status: "pending",
      }));

    const { error: recipientsError } = await supabase
      .from("email_campaign_recipients")
      .insert(recipients);

    if (recipientsError) {
      await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", campaign.id)
        .eq("organization_id", organizationId);

      setDraftMessage(
        `Unable to save recipients: ${recipientsError.message}`,
      );
      setIsSavingDraft(false);
      return;
    }

    setDraftMessage("Campaign draft saved successfully.");
    setIsSavingDraft(false);

    setTimeout(() => {
      setDraftMessage("");
    }, 5000);
  }

    const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10";

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  const primaryButtonClasses =
    "cursor-pointer rounded-md bg-[#0D0C0A] px-6 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0D0C0A] disabled:hover:text-[#D8B66A] disabled:hover:shadow-none";

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
        <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Audience
            </p>

            <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
              Select Contacts
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
                {selectedContactIds.length} selected
              </span>
            </div>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className={inputClasses}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              className={secondaryButtonClasses}
            >
              Select All Shown
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              Clear Selection
            </button>
          </div>

          <div className="mt-5 max-h-[650px] space-y-2 overflow-y-auto pr-1">
            {filteredContacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 p-6 text-center">
                <p className="font-serif text-sm text-[#29231D]">
                  No contacts found
                </p>

                <p className="mt-1 text-xs text-[#8F8578]">
                  Try changing your search term.
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const fullName = [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(" ");

                const isSelected = selectedContactIds.includes(contact.id);

                return (
                  <label
                    key={contact.id}
                    className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-300 ${
                      isSelected
                        ? "border-[#D8B66A]/60 bg-[#B7832F]/10 shadow-sm"
                        : "border-[#EDE7DC] bg-white/45 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleContact(contact.id)}
                      className="mt-1 h-4 w-4 accent-[#B7832F]"
                    />

                    <span className="min-w-0">
                      <span
                        className={`block font-serif text-sm font-medium tracking-wide transition-colors duration-300 ${
                          isSelected
                            ? "text-[#916520]"
                            : "text-[#29231D] group-hover:text-[#B7832F]"
                        }`}
                      >
                        {fullName || "Unnamed Contact"}
                      </span>

                      <span className="mt-1 block truncate text-xs text-[#8F8578]">
                        {contact.email || "No email address"}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </section>

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
                Compose a personalized email for the contacts you&apos;ve selected.
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

                  <p className="mt-1.5 font-serif text-sm font-medium tracking-wide text-[#29231D]">
                    {personalizedSubject || "No subject"}
                  </p>
                </div>

                <div className="min-h-64 whitespace-pre-wrap px-5 py-6 text-sm leading-7 text-[#5F574D]">
                  {personalizedBody || "Your email preview will appear here."}
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
                  {initialCampaign
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
                    ? initialCampaign
                      ? "Updating Draft..."
                      : "Saving Draft..."
                    : initialCampaign
                      ? "Update Draft"
                      : "Save as Draft"}
                </button>

                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md border border-[#E3DCD0] bg-white/50 px-6 py-3 text-xs font-medium tracking-wide text-[#A89C8D] opacity-60"
                >
                  Send Email
                </button>
              </div>

              <p className="text-[10px] leading-5 text-[#A89C8D]">
                Actual sending will be enabled after Gmail or Microsoft 365 is
                connected.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
function personalizeText(
  text: string,
  contact: Contact,
) {
  const fullName = [
    contact.first_name,
    contact.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const mailingAddress = formatAddress([
    contact.mailing_address_line_1,
    contact.mailing_address_line_2,
    contact.mailing_city,
    contact.mailing_state,
    contact.mailing_postal_code,
  ]);

  const propertyAddress = formatAddress([
    contact.property_address_line_1,
    contact.property_address_line_2,
    contact.property_city,
    contact.property_state,
    contact.property_postal_code,
  ]);

  return text
    .replaceAll(
      "{{first_name}}",
      contact.first_name ?? "",
    )
    .replaceAll(
      "{{last_name}}",
      contact.last_name ?? "",
    )
    .replaceAll(
      "{{full_name}}",
      fullName,
    )
    .replaceAll(
      "{{email}}",
      contact.email ?? "",
    )
    .replaceAll(
      "{{mailing_address}}",
      mailingAddress,
    )
    .replaceAll(
      "{{property_address}}",
      propertyAddress,
    );
}

function formatAddress(
  parts: Array<string | null | undefined>,
) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}