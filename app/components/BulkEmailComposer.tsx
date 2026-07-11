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
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  return (
    <>
      {skippedInitialContactCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-800/40 bg-amber-950/20 px-5 py-4">
          <p className="text-sm text-amber-300">
            {skippedInitialContactCount} selected contact
            {skippedInitialContactCount === 1 ? "" : "s"} could not be added
            because no email address is available.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(340px,0.7fr)_minmax(0,1.3fr)]">

        {/* RECIPIENTS */}
        <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              Recipients
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Select Contacts
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {selectedContactIds.length} selected
            </p>
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
              className="rounded-lg border border-[#333333] px-3 py-2 text-xs text-gray-400 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Select All Shown
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg border border-[#333333] px-3 py-2 text-xs text-gray-400 transition hover:border-red-700 hover:text-red-400"
            >
              Clear Selection
            </button>
          </div>

          <div className="mt-5 max-h-[650px] space-y-2 overflow-y-auto pr-1">
            {filteredContacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#333333] p-6 text-center text-sm text-gray-500">
                No contacts with email addresses found.
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
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-[#d4af37]/60 bg-[#d4af37]/10"
                        : "border-[#2a2a2a] bg-[#111111] hover:border-[#444444]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleContact(contact.id)}
                      className="mt-1 h-4 w-4 accent-[#d4af37]"
                    />

                    <span className="min-w-0">
                      <span className="block font-medium text-white">
                        {fullName || "Unnamed Contact"}
                      </span>

                      <span className="mt-1 block truncate text-sm text-gray-500">
                        {contact.email}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* COMPOSER */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                Compose
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Create Your Message
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Email Template
                </label>

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
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter email subject..."
                  className={inputClasses}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <label className="text-sm font-medium text-gray-300">
                    Message
                  </label>

                  <span className="text-xs text-gray-600">
                    Personalization supported
                  </span>
                </div>

                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={16}
                  placeholder={`Hi {{first_name}},\n\nWrite your message here...`}
                  className={inputClasses}
                />

                <div className="mt-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                    Insert Personalization
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1.5 text-xs text-gray-400 transition hover:border-[#d4af37] hover:text-[#d4af37]"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                  Preview
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Personalized Email Preview
                </h2>
              </div>

              {selectedContacts.length > 0 && (
                <select
                  value={previewContact?.id ?? ""}
                  onChange={(event) => setPreviewContactId(event.target.value)}
                  className="rounded-lg border border-[#333333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
                >
                  {selectedContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {[contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!previewContact ? (
              <div className="rounded-xl border border-dashed border-[#333333] p-8 text-center text-sm text-gray-500">
                Select at least one contact to preview personalization.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]">
                <div className="border-b border-[#2a2a2a] px-5 py-4">
                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    To
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {previewContact.email}
                  </p>
                </div>

                <div className="border-b border-[#2a2a2a] px-5 py-4">
                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Subject
                  </p>

                  <p className="mt-1 font-medium text-white">
                    {personalizedSubject || "No subject"}
                  </p>
                </div>

                <div className="min-h-64 whitespace-pre-wrap px-5 py-6 text-sm leading-7 text-gray-300">
                  {personalizedBody || "Your email preview will appear here."}
                </div>
              </div>
            )}
          </section>

          {/* CAMPAIGN ACTIONS */}
          <section className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-6">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                  Campaign
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
  {initialCampaign
    ? "Update or Send Campaign"
    : "Save or Send Campaign"}
</h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {selectedContactIds.length} recipient
                  {selectedContactIds.length === 1 ? "" : "s"} selected.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Campaign Name
                </label>

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
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    draftMessage.toLowerCase().includes("success")
                      ? "border-green-900/40 bg-green-950/20 text-green-300"
                      : "border-amber-800/40 bg-amber-950/20 text-amber-300"
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
                  className="rounded-lg border border-[#d4af37] px-6 py-3 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black opacity-40"
                >
                  Send Email
                </button>
              </div>

              <p className="text-xs leading-5 text-gray-600">
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

function personalizeText(value: string, contact: Contact) {
  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ");

  const mailingAddress = formatAddress(
    contact.mailing_address_line_1,
    contact.mailing_address_line_2,
    contact.mailing_city,
    contact.mailing_state,
    contact.mailing_postal_code,
  );

  const propertyAddress = formatAddress(
    contact.property_address_line_1,
    contact.property_address_line_2,
    contact.property_city,
    contact.property_state,
    contact.property_postal_code,
  );

  return value
    .replaceAll("{{first_name}}", contact.first_name ?? "")
    .replaceAll("{{last_name}}", contact.last_name ?? "")
    .replaceAll("{{full_name}}", fullName)
    .replaceAll("{{email}}", contact.email ?? "")
    .replaceAll("{{mailing_address}}", mailingAddress)
    .replaceAll("{{property_address}}", propertyAddress);
}

function formatAddress(
  line1: string | null,
  line2: string | null,
  city: string | null,
  state: string | null,
  postalCode: string | null,
) {
  const cityStateZip = [
    city?.trim() || "",
    [state?.trim() || "", postalCode?.trim() || ""].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return [line1?.trim() || "", line2?.trim() || "", cityStateZip]
    .filter(Boolean)
    .join("\n");
}
