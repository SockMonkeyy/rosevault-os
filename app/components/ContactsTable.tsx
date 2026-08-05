/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  contact_kind: "person" | "business";
  display_name: string;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_phone: string | null;
  primary_phone_type: string | null;
  secondary_phone: string | null;
  secondary_phone_type: string | null;
  spouse_primary_phone: string | null;
  spouse_primary_phone_type: string | null;
  spouse_secondary_phone: string | null;
  spouse_secondary_phone_type: string | null;
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
  initialContacts: Contact[];
  groups: Group[];
  tags: Tag[];
  groupMemberships: GroupMembership[];
  tagAssignments: TagAssignment[];
  organizationId: string;
};

type SortField =
  "display_name" | "contact_type" | "status" | "email" | "created_at";
type SortOrder = "asc" | "desc";

export default function ContactsTable({
  initialContacts = [],
  groups = [],
  tags = [],
  groupMemberships = [],
  tagAssignments = [],
  organizationId,
}: Props) {
  function ContactStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      new: "border-sky-200 bg-sky-50 text-sky-700",
      active: "border-emerald-200 bg-emerald-50 text-emerald-700",
      nurture: "border-amber-200 bg-amber-50 text-amber-700",
      past_client: "border-[#D8B66A]/40 bg-[#B7832F]/5 text-[#916520]",
      inactive: "border-[#E3DCD0] bg-[#12110F]/5 text-[#7C7265]",
      do_not_contact: "border-red-200 bg-red-50 text-red-700",
    };

    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${
          styles[status.toLowerCase()] ??
          "border-[#E3DCD0] bg-white text-[#7C7265]"
        }`}
      >
        {status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())}
      </span>
    );
  }

  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("display_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [searchResults, setSearchResults] =
    useState<Contact[]>(initialContacts);
  const [totalCount, setTotalCount] = useState<number>(initialContacts.length);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkTagId, setBulkTagId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);

  // 1. Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // 2. Server-side search & count query whenever search query changes
  useEffect(() => {
    async function executeSearch() {
      setIsSearching(true);

      let query = supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .eq("organization_id", organizationId);

      const term = debouncedSearch.trim();
      if (term) {
        const cleanTerm = term.replace(/[%(),]/g, "");
        query = query.or(
          `display_name.ilike.%${cleanTerm}%,business_name.ilike.%${cleanTerm}%,first_name.ilike.%${cleanTerm}%,last_name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%,primary_phone.ilike.%${cleanTerm}%`,
        );
      }

      query = query.order("display_name", { ascending: true });

      const { data, count, error } = await query;

      if (!error && data) {
        setSearchResults(data as Contact[]);
        setTotalCount(count ?? data.length);
      }

      setIsSearching(false);
    }

    executeSearch();
  }, [debouncedSearch, organizationId]);

  // Handle column sorting toggle
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  // 3. Client-side filters applied to the server-returned search results
  const filteredContacts = useMemo(() => {
    return searchResults.filter((contact) => {
      const matchesKind =
        kindFilter === "all" || contact.contact_kind === kindFilter;

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
        matchesKind &&
        matchesType &&
        matchesStatus &&
        matchesGroup &&
        matchesTag
      );
    });
  }, [
    searchResults,
    kindFilter,
    typeFilter,
    statusFilter,
    groupFilter,
    tagFilter,
    groupMemberships,
    tagAssignments,
  ]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    if (currentPage === 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    debouncedSearch,
    kindFilter,
    typeFilter,
    statusFilter,
    groupFilter,
    tagFilter,
    currentPage,
  ]);

  const totalPages =
    pageSize === "all"
      ? 1
      : Math.ceil(filteredContacts.length / Number(pageSize)) || 1;

  const startIndex = filteredContacts.length === 0
    ? 0
    : pageSize === "all"
    ? 1
    : (currentPage - 1) * Number(pageSize) + 1;

  const endIndex = filteredContacts.length === 0
    ? 0
    : pageSize === "all"
    ? filteredContacts.length
    : Math.min(currentPage * Number(pageSize), filteredContacts.length);

  const paginatedContacts = useMemo(() => {
    let sliceTarget = filteredContacts;
    if (pageSize !== "all") {
      const start = (currentPage - 1) * Number(pageSize);
      sliceTarget = filteredContacts.slice(start, start + Number(pageSize));
    }

    // Apply sorting strictly to the currently viewed page items
    return [...sliceTarget].sort((a, b) => {
      let aVal: string = String(a[sortField] ?? "");
      let bVal: string = String(b[sortField] ?? "");

      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, currentPage, pageSize, sortField, sortOrder]);

  const visibleContactIds = filteredContacts.map((contact) => contact.id);

  const allVisibleSelected =
    visibleContactIds.length > 0 &&
    visibleContactIds.every((id) => selectedContactIds.includes(id));

  const hasActiveFilters =
    Boolean(search) ||
    kindFilter !== "all" ||
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
    setDebouncedSearch("");
    setKindFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setGroupFilter("all");
    setTagFilter("all");
    setSortField("display_name");
    setSortOrder("asc");
    setCurrentPage(1);
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

    const { data, error } = await supabase
      .from("contacts")
      .delete()
      .eq("organization_id", organizationId)
      .in("id", selectedContactIds)
      .select();

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

    startTransition(() => {
      router.refresh();
    });
  }

  function getSelectedContacts() {
    return searchResults.filter((contact) =>
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
      "Display Name",
      "Contact Kind",
      "Business Name",
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
      contact.display_name,
      contact.contact_kind,
      contact.business_name,
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.primary_phone,
      contact.primary_phone_type,
      contact.secondary_phone,
      contact.secondary_phone_type,
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
      "Display Name",
      "Contact Kind",
      "Business Name",
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
      contact.display_name,
      contact.contact_kind,
      contact.business_name,
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.primary_phone,
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
        const fullName = [contact.display_name].filter(Boolean).join(" ");

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
    startTransition(() => {
      router.refresh();
    });
  }

  async function addSelectedTag() {
    if (!bulkTagId || selectedContactIds.length === 0) {
      return;
    }

    setIsSaving(true);
    setBulkMessage("");

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
    startTransition(() => {
      router.refresh();
    });
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
    "rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-xs text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#B7AEA2] hover:border-[#D5CABB] focus:border-[#B7832F]/60 focus:bg-white focus:ring-2 focus:ring-[#B7832F]/10";

  const secondaryButtonClasses =
    "cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F] hover:shadow-sm active:translate-y-0 active:scale-[0.99]";

  return (
    <div className="overflow-hidden rounded-xl border border-[#EDE7DC] bg-white/40 backdrop-blur-sm">
      {/* Search and Filters */}
      <div className="border-b border-[#EDE7DC]/80 p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Contact Registry
            </p>

            <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
              All Contacts
            </h2>

            <p className="mt-1.5 text-xs text-[#7C7265]">
              Showing {filteredContacts.length > 0 ? startIndex : 0}–{endIndex}{" "}
              of {totalCount} contacts
              {isSearching && " (Searching...)"}
            </p>
          </div>

          <div className="relative w-full xl:max-w-md">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, or business..."
              className={`${inputClasses} w-full`}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap items-center">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className={inputClasses}
          >
            <option value="all">All Contacts</option>
            <option value="person">Persons</option>
            <option value="business">Businesses</option>
          </select>

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
            <option value="title_rep">Title Rep</option>
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

          <div className="flex items-center gap-2 text-xs text-[#7C7265] ml-auto">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "all" ? "all" : Number(val));
                setCurrentPage(1);
              }}
              className={inputClasses}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className={secondaryButtonClasses}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Main Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE7DC]/80 pt-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportSelectedContacts}
              className={secondaryButtonClasses}
            >
              Export Contacts CSV
            </button>

            <button
              type="button"
              onClick={generateMailingLabels}
              className={secondaryButtonClasses}
            >
              Print Mailing Labels
            </button>

            <button
              type="button"
              onClick={exportPropertyAddresses}
              className={secondaryButtonClasses}
            >
              Export Property Addresses
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openBulkEmailComposer}
              className="cursor-pointer rounded-md bg-[#0D0C0A] px-4 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#211E1A] hover:text-[#EAE5DE] hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              Bulk Email Selected
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteConfirmation("");
                setShowDeleteModal(true);
              }}
              className="cursor-pointer rounded-md border border-red-200 bg-red-50/30 px-4 py-3 text-xs font-medium tracking-wide text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              Delete Selected Contacts
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedContactIds.length > 0 && (
        <div className="border-b border-[#D8B66A]/30 bg-[#B7832F]/5 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-sm font-medium tracking-wide text-[#916520]">
                  {selectedContactIds.length} contact
                  {selectedContactIds.length === 1 ? "" : "s"} selected
                </p>

                <p className="mt-1 text-xs text-[#7C7265]">
                  Apply actions to all selected contacts.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSelection}
                className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A89C8D] transition-colors duration-300 hover:text-[#B7832F]"
              >
                Clear Selection
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
                  className="cursor-pointer rounded-md border border-[#D8B66A]/50 bg-white/50 px-4 py-3 text-xs font-medium tracking-wide text-[#916520] transition-all duration-300 hover:border-[#D8B66A] hover:bg-[#B7832F]/10 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="cursor-pointer rounded-md border border-[#D8B66A]/50 bg-white/50 px-4 py-3 text-xs font-medium tracking-wide text-[#916520] transition-all duration-300 hover:border-[#D8B66A] hover:bg-[#B7832F]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {bulkMessage && (
              <div className="rounded-md border border-[#E3DCD0] bg-white/60 px-4 py-3 text-xs text-[#5F574D]">
                {bulkMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Status Message */}
      {bulkMessage && selectedContactIds.length === 0 && (
        <div
          className={`border-b px-5 py-4 text-xs ${
            bulkMessage.toLowerCase().includes("unable") ||
            bulkMessage.toLowerCase().includes("error")
              ? "border-red-200 bg-red-50/70 text-red-700"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-700"
          }`}
        >
          {bulkMessage}
        </div>
      )}

      {/* Empty Results */}
      {filteredContacts.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Registry Empty
            </p>
            <h3 className="font-serif text-base text-[#29231D]">
              No contacts found
            </h3>
            <p className="mt-1 text-xs text-[#7C7265]">
              {hasActiveFilters
                ? "Try adjusting your search query or filter options."
                : "Get started by adding your first contact."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={`${secondaryButtonClasses} mt-4`}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Table Content */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#29231D]">
            <thead className="border-b border-[#EDE7DC] bg-[#FAF7F2]/80 text-[10px] font-semibold uppercase tracking-wider text-[#7C7265]">
              <tr>
                <th className="w-12 px-4 py-3.5">
                  <span className="sr-only">Select All</span>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-[#E3DCD0] text-[#B7832F] focus:ring-[#B7832F]/20"
                  />
                </th>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("display_name")}
                    className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[#7C7265] hover:text-[#B7832F]"
                  >
                    Display Name
                    <span className="flex flex-col text-[8px] leading-none text-[#B7AEA2] group-hover:text-[#B7832F]">
                      <span
                        className={
                          sortField === "display_name" && sortOrder === "asc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▲
                      </span>
                      <span
                        className={
                          sortField === "display_name" && sortOrder === "desc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▼
                      </span>
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("contact_type")}
                    className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[#7C7265] hover:text-[#B7832F]"
                  >
                    Type & Status
                    <span className="flex flex-col text-[8px] leading-none text-[#B7AEA2] group-hover:text-[#B7832F]">
                      <span
                        className={
                          sortField === "contact_type" && sortOrder === "asc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▲
                      </span>
                      <span
                        className={
                          sortField === "contact_type" && sortOrder === "desc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▼
                      </span>
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("email")}
                    className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[#7C7265] hover:text-[#B7832F]"
                  >
                    Contact Info
                    <span className="flex flex-col text-[8px] leading-none text-[#B7AEA2] group-hover:text-[#B7832F]">
                      <span
                        className={
                          sortField === "email" && sortOrder === "asc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▲
                      </span>
                      <span
                        className={
                          sortField === "email" && sortOrder === "desc"
                            ? "text-[#B7832F] font-bold"
                            : ""
                        }
                      >
                        ▼
                      </span>
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3.5">Groups & Tags</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE7DC]">
              {paginatedContacts.map((contact) => {
                const isSelected = selectedContactIds.includes(contact.id);
                const contactGroups = getContactGroups(contact.id);
                const contactTags = getContactTags(contact.id);

                return (
                  <tr
                    key={contact.id}
                    className={`transition-colors duration-150 hover:bg-[#FAF7F2]/60 ${
                      isSelected ? "bg-[#B7832F]/5" : ""
                    }`}
                  >
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContact(contact.id)}
                        className="h-4 w-4 rounded border-[#E3DCD0] text-[#B7832F] focus:ring-[#B7832F]/20"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-[#29231D] hover:text-[#B7832F]"
                      >
                        {contact.display_name}
                      </Link>
                      {contact.business_name && (
                        <p className="mt-0.5 text-[11px] text-[#7C7265]">
                          {contact.business_name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-medium tracking-wide text-[#7C7265]">
                          {formatLabel(contact.contact_type)}
                        </span>
                        <ContactStatusBadge status={contact.status} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-0.5 text-[11px]">
                        {contact.email && (
                          <p className="text-[#29231D]">
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:underline"
                            >
                              {contact.email}
                            </a>
                          </p>
                        )}
                        {contact.primary_phone && (
                          <p className="text-[#7C7265]">
                            <a
                              href={`tel:${contact.primary_phone}`}
                              className="hover:underline"
                            >
                              {contact.primary_phone}
                            </a>
                            {contact.primary_phone_type &&
                              ` (${formatLabel(contact.primary_phone_type)})`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {contactGroups.map((group) => (
                          <span
                            key={group.id}
                            className="rounded bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] text-[#7C7265] border border-[#E3DCD0]"
                          >
                            {group.name}
                          </span>
                        ))}
                        {contactTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded bg-[#B7832F]/10 px-1.5 py-0.5 text-[10px] text-[#916520] border border-[#D8B66A]/30"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-[#B7832F] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredContacts.length > 0 && pageSize !== "all" && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#EDE7DC] px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-[#7C7265]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "all" ? "all" : Number(val));
                setCurrentPage(1);
              }}
              className="rounded border border-[#E3DCD0] bg-white px-2 py-1 text-xs text-[#29231D] outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#7C7265]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="rounded border border-[#E3DCD0] bg-white px-3 py-1 text-xs font-medium text-[#7C7265] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="rounded border border-[#E3DCD0] bg-white px-3 py-1 text-xs font-medium text-[#7C7265] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[#EDE7DC] bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg text-[#29231D]">
              Permanently Delete Contacts?
            </h3>
            <p className="mt-2 text-xs text-[#7C7265]">
              You are about to delete {selectedContactIds.length} contact
              {selectedContactIds.length === 1 ? "" : "s"}. This action cannot
              be undone. Type{" "}
              <span className="font-bold text-red-600">DELETE</span> below to
              confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className={`${inputClasses} mt-4 w-full`}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className={secondaryButtonClasses}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                onClick={deleteSelectedContacts}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-3 text-xs font-medium tracking-wide text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
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
