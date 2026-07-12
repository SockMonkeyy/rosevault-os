"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;

  cell_phone: string | null;
  cell_phone_type: string | null;
  business_phone: string | null;
  business_phone_type: string | null;

  contact_type: string;
  status: string;
  lead_source: string | null;

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

  created_at: string;
};

type Group = {
  id: string;
  name: string;
};

type Tag = {
  id: string;
  name: string;
};

type GroupMembership = {
  contact_id: string;
  group_id: string;
};

type TagAssignment = {
  contact_id: string;
  tag_id: string;
};

type Props = {
  contacts: Contact[];
  groups: Group[];
  tags: Tag[];
  groupMemberships: GroupMembership[];
  tagAssignments: TagAssignment[];
  organizationId: string;
};

export default function ContactsTable({
  contacts,
  groups,
  tags,
  groupMemberships,
  tagAssignments,
  organizationId,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkTagId, setBulkTagId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredContacts = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return contacts.filter((contact) => {
      const searchableText = [
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.cell_phone,
        contact.business_phone,
        contact.lead_source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      const matchesType =
        typeFilter === "all" || contact.contact_type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || contact.status === statusFilter;

      const matchesGroup =
        groupFilter === "all" ||
        groupMemberships.some(
          (membership) =>
            membership.contact_id === contact.id &&
            membership.group_id === groupFilter,
        );

      const matchesTag =
        tagFilter === "all" ||
        tagAssignments.some(
          (assignment) =>
            assignment.contact_id === contact.id &&
            assignment.tag_id === tagFilter,
        );

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesGroup &&
        matchesTag
      );
    });
  }, [
    contacts,
    search,
    typeFilter,
    statusFilter,
    groupFilter,
    tagFilter,
    groupMemberships,
    tagAssignments,
  ]);

  const visibleContactIds = filteredContacts.map((contact) => contact.id);

  const allVisibleSelected =
    visibleContactIds.length > 0 &&
    visibleContactIds.every((id) => selectedContactIds.includes(id));

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    groupFilter !== "all" ||
    tagFilter !== "all";

  function openBulkEmailComposer() {
    if (selectedContactIds.length === 0) {
      return;
    }

    const contactIds = selectedContactIds.join(",");
    router.push(`/email/compose?contacts=${encodeURIComponent(contactIds)}`);
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setGroupFilter("all");
    setTagFilter("all");
  }

  function toggleContact(contactId: string) {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
    setBulkMessage("");
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedContactIds((current) =>
        current.filter((id) => !visibleContactIds.includes(id)),
      );
    } else {
      setSelectedContactIds((current) => [
        ...new Set([...current, ...visibleContactIds]),
      ]);
    }
    setBulkMessage("");
  }

  function clearSelection() {
    setSelectedContactIds([]);
    setBulkGroupId("");
    setBulkTagId("");
    setBulkMessage("");
  }

  async function deleteSelectedContacts() {
    if (selectedContactIds.length === 0 || deleteConfirmation !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    setBulkMessage("");

    const contactCount = selectedContactIds.length;
    const supabase = createClient();

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("organization_id", organizationId)
      .in("id", selectedContactIds);

    if (error) {
      setBulkMessage(`Unable to delete contacts: ${error.message}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
      return;
    }

    setSelectedContactIds([]);
    setBulkGroupId("");
    setBulkTagId("");
    setDeleteConfirmation("");
    setShowDeleteModal(false);
    setIsDeleting(false);

    setBulkMessage(
      `${contactCount} contact${
        contactCount === 1 ? "" : "s"
      } permanently deleted.`,
    );

    setTimeout(() => {
      setBulkMessage("");
    }, 5000);

    router.refresh();
  }

  function getSelectedContacts() {
    return contacts.filter((contact) =>
      selectedContactIds.includes(contact.id),
    );
  }

  function escapeCsvValue(value: string | null | undefined) {
    const stringValue = value ?? "";
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function downloadCsv(
    filename: string,
    headers: string[],
    rows: (string | null | undefined)[][],
  ) {
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function exportSelectedContacts() {
    const selectedContacts = getSelectedContacts();

    if (selectedContacts.length === 0) {
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Primary Phone",
      "Primary Phone Type",
      "Secondary Phone",
      "Secondary Phone Type",
      "Contact Type",
      "Status",
      "Lead Source",
      "Mailing Address Line 1",
      "Mailing Address Line 2",
      "Mailing City",
      "Mailing State",
      "Mailing ZIP",
      "Property Address Line 1",
      "Property Address Line 2",
      "Property City",
      "Property State",
      "Property ZIP",
    ];

    const rows = selectedContacts.map((contact) => [
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.cell_phone,
      contact.cell_phone_type,
      contact.business_phone,
      contact.business_phone_type,
      contact.contact_type,
      contact.status,
      contact.lead_source,
      contact.mailing_address_line_1,
      contact.mailing_address_line_2,
      contact.mailing_city,
      contact.mailing_state,
      contact.mailing_postal_code,
      contact.property_address_line_1,
      contact.property_address_line_2,
      contact.property_city,
      contact.property_state,
      contact.property_postal_code,
    ]);

    downloadCsv(
      `rosevault-contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    );

    setBulkMessage(
      `${selectedContacts.length} contact${
        selectedContacts.length === 1 ? "" : "s"
      } exported successfully.`,
    );
  }

  function exportPropertyAddresses() {
    const selectedContacts = getSelectedContacts();

    if (selectedContacts.length === 0) {
      return;
    }

    const contactsWithPropertyAddress = selectedContacts.filter(
      (contact) => contact.property_address_line_1,
    );

    if (contactsWithPropertyAddress.length === 0) {
      setBulkMessage("None of the selected contacts have a property address.");
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Primary Phone",
      "Property Address Line 1",
      "Property Address Line 2",
      "Property City",
      "Property State",
      "Property ZIP",
    ];

    const rows = contactsWithPropertyAddress.map((contact) => [
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.cell_phone,
      contact.property_address_line_1,
      contact.property_address_line_2,
      contact.property_city,
      contact.property_state,
      contact.property_postal_code,
    ]);

    downloadCsv(
      `rosevault-property-addresses-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      headers,
      rows,
    );

    setBulkMessage(
      `${contactsWithPropertyAddress.length} property address${
        contactsWithPropertyAddress.length === 1 ? "" : "es"
      } exported successfully.`,
    );
  }

  function generateMailingLabels() {
    const selectedContacts = getSelectedContacts();

    if (selectedContacts.length === 0) {
      return;
    }

    const contactsWithMailingAddresses = selectedContacts.filter(
      (contact) => contact.mailing_address_line_1,
    );

    if (contactsWithMailingAddresses.length === 0) {
      setBulkMessage("None of the selected contacts have a mailing address.");
      return;
    }

    const labelsHtml = contactsWithMailingAddresses
      .map((contact) => {
        const fullName = [contact.first_name, contact.last_name]
          .filter(Boolean)
          .join(" ");

        const city = contact.mailing_city?.trim() || "";
        const state = contact.mailing_state?.trim() || "";
        const zip = contact.mailing_postal_code?.trim() || "";

        const cityStateZip = [city, [state, zip].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ");

        return `
        <div class="label">
          <div class="name">${escapeHtml(fullName)}</div>
          <div>${escapeHtml(contact.mailing_address_line_1 || "")}</div>
          ${
            contact.mailing_address_line_2
              ? `<div>${escapeHtml(contact.mailing_address_line_2)}</div>`
              : ""
          }
          <div>${escapeHtml(cityStateZip)}</div>
        </div>
      `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      setBulkMessage(
        "Your browser blocked the mailing-label window. Please allow pop-ups for RoseVault and try again.",
      );
      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>RoseVault Mailing Labels</title>
        <style>
          @page { size: letter; margin: 0.5in 0.1875in; }
          * { box-sizing: border-box; }
          body { margin: 0; background: white; color: black; font-family: Arial, Helvetica, sans-serif; }
          .labels { display: grid; grid-template-columns: repeat(3, 2.625in); grid-auto-rows: 1in; column-gap: 0.125in; row-gap: 0; justify-content: center; }
          .label { width: 2.625in; height: 1in; padding: 0.12in 0.15in; overflow: hidden; font-size: 10pt; line-height: 1.2; display: flex; flex-direction: column; justify-content: center; page-break-inside: avoid; }
          .name { font-weight: 700; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="labels">${labelsHtml}</div>
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `);

    printWindow.document.close();

    setBulkMessage(
      `${contactsWithMailingAddresses.length} mailing label${
        contactsWithMailingAddresses.length === 1 ? "" : "s"
      } prepared for printing.`,
    );
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function addSelectedToGroup() {
    if (!bulkGroupId || selectedContactIds.length === 0) {
      return;
    }

    setIsSaving(true);
    setBulkMessage("");

    const supabase = createClient();

    const rows = selectedContactIds.map((contactId) => ({
      organization_id: organizationId,
      contact_id: contactId,
      group_id: bulkGroupId,
    }));

    const { error } = await supabase
      .from("contact_group_memberships")
      .upsert(rows, {
        onConflict: "contact_id,group_id",
        ignoreDuplicates: true,
      });

    if (error) {
      setBulkMessage(error.message);
      setIsSaving(false);
      return;
    }

    setBulkMessage(
      `${selectedContactIds.length} contact${
        selectedContactIds.length === 1 ? "" : "s"
      } added to the selected group.`,
    );

    setBulkGroupId("");
    setIsSaving(false);
    router.refresh();
  }

  async function addSelectedTag() {
    if (!bulkTagId || selectedContactIds.length === 0) {
      return;
    }

    setIsSaving(true);
    setBulkMessage("");

    const supabase = createClient();

    const rows = selectedContactIds.map((contactId) => ({
      organization_id: organizationId,
      contact_id: contactId,
      tag_id: bulkTagId,
    }));

    const { error } = await supabase
      .from("contact_tag_assignments")
      .upsert(rows, {
        onConflict: "contact_id,tag_id",
        ignoreDuplicates: true,
      });

    if (error) {
      setBulkMessage(error.message);
      setIsSaving(false);
      return;
    }

    setBulkMessage(
      `${selectedContactIds.length} contact${
        selectedContactIds.length === 1 ? "" : "s"
      } tagged successfully.`,
    );

    setBulkTagId("");
    setIsSaving(false);
    router.refresh();
  }

  function getContactGroups(contactId: string) {
    const groupIds = groupMemberships
      .filter((membership) => membership.contact_id === contactId)
      .map((membership) => membership.group_id);

    return groups.filter((group) => groupIds.includes(group.id));
  }

  function getContactTags(contactId: string) {
    const tagIds = tagAssignments
      .filter((assignment) => assignment.contact_id === contactId)
      .map((assignment) => assignment.tag_id);

    return tags.filter((tag) => tagIds.includes(tag.id));
  }

  function formatLabel(value: string) {
    if (!value) return "";
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const inputClasses =
    "rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#151515]">
      {/* Search and Filters */}
      <div className="border-b border-[#2a2a2a] p-5">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">All Contacts</h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, or source..."
            className={`${inputClasses} w-full xl:max-w-md`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={inputClasses}
          >
            <option value="all">All Types</option>
            <option value="lead">Lead</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="investor">Investor</option>
            <option value="agent">Agent</option>
            <option value="lender">Lender</option>
            <option value="attorney">Attorney</option>
            <option value="contractor">Contractor</option>
            <option value="vendor">Vendor</option>
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClasses}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="nurture">Nurture</option>
            <option value="past_client">Past Client</option>
            <option value="inactive">Inactive</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>

          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className={inputClasses}
          >
            <option value="all">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className={inputClasses}
          >
            <option value="all">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[#333333] px-4 py-3 text-sm text-gray-400 transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-[#d4af37]/20 pt-4">
          <button
            type="button"
            onClick={exportSelectedContacts}
            className="rounded-lg border border-[#333333] px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Export Contacts CSV
          </button>

          <button
            type="button"
            onClick={generateMailingLabels}
            className="rounded-lg border border-[#333333] px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Print Mailing Labels
          </button>

          <button
            type="button"
            onClick={exportPropertyAddresses}
            className="rounded-lg border border-[#333333] px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Export Property Addresses
          </button>

          <button
            type="button"
            onClick={openBulkEmailComposer}
            className="rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
          >
            Bulk Email Selected
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmation("");
              setShowDeleteModal(true);
            }}
            className="rounded-lg border border-red-900/60 px-4 py-3 text-sm font-medium text-red-400 transition hover:border-red-500 hover:bg-red-950/30 hover:text-red-300"
          >
            Delete Selected Contacts
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedContactIds.length > 0 && (
        <div className="border-b border-[#d4af37]/30 bg-[#d4af37]/5 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#d4af37]">
                  {selectedContactIds.length} contact
                  {selectedContactIds.length === 1 ? "" : "s"} selected
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Apply actions to all selected contacts.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-gray-500 transition hover:text-white"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <select
                  value={bulkGroupId}
                  onChange={(event) => setBulkGroupId(event.target.value)}
                  className={`${inputClasses} flex-1`}
                >
                  <option value="">Choose a group...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addSelectedToGroup}
                  disabled={isSaving || !bulkGroupId}
                  className="rounded-lg border border-[#d4af37]/50 px-4 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add to Group
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <select
                  value={bulkTagId}
                  onChange={(event) => setBulkTagId(event.target.value)}
                  className={`${inputClasses} flex-1`}
                >
                  <option value="">Choose a tag...</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addSelectedTag}
                  disabled={isSaving || !bulkTagId}
                  className="rounded-lg border border-[#d4af37]/50 px-4 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {bulkMessage && (
              <div className="rounded-lg border border-[#333333] bg-[#111111] px-4 py-3 text-sm text-gray-300">
                {bulkMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {bulkMessage && selectedContactIds.length === 0 && (
        <div
          className={`border-b px-5 py-4 text-sm ${
            bulkMessage.toLowerCase().includes("unable") ||
            bulkMessage.toLowerCase().includes("error")
              ? "border-red-900/40 bg-red-950/20 text-red-300"
              : "border-green-900/40 bg-green-950/20 text-green-300"
          }`}
        >
          {bulkMessage}
        </div>
      )}

      {/* Empty Results */}
      {filteredContacts.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h3 className="text-xl font-semibold">No matching contacts</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Try changing your search term or removing one of the filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg border border-[#d4af37]/50 px-5 py-2.5 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#2a2a2a] bg-[#111111]">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="w-12 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible contacts"
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                </th>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Primary Phone</th>
                <th className="px-5 py-4 font-medium">Secondary Phone</th>
                <th className="px-5 py-4 font-medium">Groups & Tags</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredContacts.map((contact) => {
                const contactGroups = getContactGroups(contact.id);
                const contactTags = getContactTags(contact.id);
                const isSelected = selectedContactIds.includes(contact.id);

                return (
                  <tr
                    key={contact.id}
                    className={`transition ${
                      isSelected ? "bg-[#d4af37]/5" : "hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContact(contact.id)}
                        aria-label={`Select ${contact.first_name} ${
                          contact.last_name ?? ""
                        }`}
                        className="h-4 w-4 accent-[#d4af37]"
                      />
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-white transition hover:text-[#d4af37]"
                      >
                        {contact.first_name} {contact.last_name ?? ""}
                      </Link>
                      {contact.lead_source && (
                        <p className="mt-1 text-xs text-gray-600">
                          {contact.lead_source}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-300">
                      {formatLabel(contact.contact_type)}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-400">
                      {contact.email || "—"}
                    </td>

                    {/* Primary Phone Column */}
                    <td className="px-5 py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{contact.cell_phone || "—"}</span>

                        {contact.cell_phone && contact.cell_phone_type && (
                          <span className="rounded bg-[#222] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                            {formatLabel(contact.cell_phone_type)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Secondary Phone Column */}
                    <td className="px-5 py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{contact.business_phone || "—"}</span>

                        {contact.business_phone &&
                          contact.business_phone_type && (
                            <span className="rounded bg-[#222] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              {formatLabel(contact.business_phone_type)}
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs text-[#d4af37]">
                        {formatLabel(contact.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-contacts-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-red-900/50 bg-[#151515] p-6 shadow-2xl">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
                Permanent Action
              </p>
              <h2
                id="delete-contacts-title"
                className="mt-2 text-2xl font-semibold text-white"
              >
                Delete {selectedContactIds.length} selected contact
                {selectedContactIds.length === 1 ? "" : "s"}?
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                This permanently removes the selected contact
                {selectedContactIds.length === 1 ? "" : "s"} from RoseVault.
                Their group memberships and tag assignments will also be
                removed. This action cannot be undone.
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirm-delete-input"
                className="mb-2 block text-sm font-medium text-gray-400"
              >
                Type <span className="font-bold text-white">DELETE</span> to
                confirm permanent removal
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border border-red-900/50 bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-700 focus:border-red-500"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="rounded-lg border border-[#333333] px-5 py-2.5 text-sm font-medium text-gray-400 transition hover:border-[#555] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
                onClick={deleteSelectedContacts}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
