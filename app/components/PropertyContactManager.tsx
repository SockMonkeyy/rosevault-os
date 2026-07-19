"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  contact_type: string | null;
};

type PropertyRelationship = {
  contact_id: string;
  relationship_type: string | null;
  is_primary: boolean | null;
};

type Props = {
  propertyId: string;
  organizationId: string;
  contacts: Contact[];
  relationships: PropertyRelationship[];
};

const RELATIONSHIP_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "seller", label: "Seller" },
  { value: "buyer", label: "Buyer" },
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "agent", label: "Agent" },
  { value: "investor", label: "Investor" },
  { value: "contractor", label: "Contractor" },
  { value: "property_manager", label: "Property Manager" },
  { value: "other", label: "Other" },
];

export default function PropertyContactManager({
  propertyId,
  organizationId,
  contacts,
  relationships,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [relationshipType, setRelationshipType] = useState("owner");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const linkedIds = useMemo(
    () => new Set(relationships.map((relationship) => relationship.contact_id)),
    [relationships],
  );

  const availableContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contacts
      .filter((contact) => !linkedIds.has(contact.id))
      .filter((contact) => {
        if (!query) {
          return true;
        }

        const fullName = [contact.first_name, contact.last_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          fullName.includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.primary_phone?.toLowerCase().includes(query) ||
          contact.secondary_phone?.toLowerCase().includes(query) ||
          contact.contact_type?.toLowerCase().includes(query)
        );
      });
  }, [contacts, linkedIds, search]);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? null;

  function openModal() {
    setSearch("");
    setSelectedContactId("");
    setRelationshipType("owner");
    setIsPrimary(false);
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsOpen(false);
    setErrorMessage("");
  }

  async function handleLinkContact() {
    if (!selectedContactId) {
      setErrorMessage("Select a contact to link to this property.");
      return;
    }

    if (!relationshipType) {
      setErrorMessage("Select a relationship type.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("contact_property_relationships")
        .insert({
          organization_id: organizationId,
          property_id: propertyId,
          contact_id: selectedContactId,
          relationship_type: relationshipType,
          is_primary: isPrimary,
        });

      if (error) {
        setErrorMessage(`Unable to link contact: ${error.message}`);
        setIsSaving(false);
        return;
      }

      setIsOpen(false);
      setIsSaving(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to link contact: ${error.message}`
          : "An unexpected error occurred while linking the contact.",
      );

      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg bg-[#B7832F] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#D8B66A]"
      >
        + Link Contact
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#5C544A]/40 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#EDE7DC] bg-[#FBF9F6] shadow-xl transition-all duration-300">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#EDE7DC] p-6">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#B7832F]">
                  Link Existing Contact
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#5C544A]">
                  Search your RoseVault contacts and connect an existing
                  person or business to this property.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close"
                className="shrink-0 rounded-lg border border-[#EDE7DC] bg-white/50 px-3 py-2 text-[#7C7265] transition hover:border-[#D8B66A]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Search */}
              <div>
                <label
                  htmlFor="contact-search"
                  className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
                >
                  Search contacts
                </label>

                <input
                  id="contact-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, phone, or contact type..."
                  className="w-full rounded-lg border border-[#EDE7DC] bg-white px-4 py-3 text-[#5C544A] outline-none transition placeholder:text-[#8F8578]/50 focus:border-[#D8B66A]/60"
                />
              </div>

              {/* Contact results */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                    Available contacts
                  </p>

                  <p className="text-xs text-[#7C7265]">
                    {availableContacts.length} available
                  </p>
                </div>

                {availableContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/45 px-5 py-8 text-center backdrop-blur-sm">
                    <p className="text-sm text-[#7C7265]">
                      {contacts.length === 0
                        ? "No contacts exist in RoseVault yet."
                        : "No available contacts match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {availableContacts.map((contact) => {
                      const fullName =
                        [contact.first_name, contact.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unnamed Contact";

                      const isSelected = selectedContactId === contact.id;

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className={`w-full rounded-xl border p-4 text-left transition duration-200 ${
                            isSelected
                              ? "border-[#D8B66A] bg-white shadow-sm"
                              : "border-[#EDE7DC] bg-white/45 backdrop-blur-sm hover:border-[#D8B66A]/40 hover:bg-white/75"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p
                                className={`font-serif text-base font-normal ${
                                  isSelected ? "text-[#B7832F]" : "text-[#5C544A]"
                                }`}
                              >
                                {fullName}
                              </p>

                              {contact.email && (
                                <p className="mt-1 truncate text-sm text-[#7C7265]">
                                  {contact.email}
                                </p>
                              )}

                              {(contact.primary_phone ||
                                contact.secondary_phone) && (
                                <p className="mt-1 text-xs text-[#8F8578]">
                                  {contact.primary_phone ||
                                    contact.secondary_phone}
                                </p>
                              )}
                            </div>

                            {contact.contact_type && (
                              <span className="shrink-0 rounded-full border border-[#D8CDBE] bg-white/60 px-2.5 py-0.5 text-xs capitalize text-[#7C7265]">
                                {contact.contact_type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Relationship settings */}
              {selectedContact && (
                <div className="space-y-5 rounded-xl border border-[#D8B66A]/30 bg-white/60 p-5 shadow-sm">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
                      Selected Contact
                    </p>

                    <p className="mt-2 font-serif text-lg font-normal text-[#B7832F]">
                      {[selectedContact.first_name, selectedContact.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Contact"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="relationship-type"
                      className="mb-2 block text-sm font-medium text-[#5C544A]"
                    >
                      Relationship to property
                    </label>

                    <select
                      id="relationship-type"
                      value={relationshipType}
                      onChange={(event) => setRelationshipType(event.target.value)}
                      className="w-full rounded-lg border border-[#EDE7DC] bg-white px-4 py-3 text-[#5C544A] outline-none transition focus:border-[#D8B66A]/60"
                    >
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#EDE7DC] bg-white/45 p-4 transition hover:bg-white/80">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(event) => setIsPrimary(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#EDE7DC] text-[#B7832F] focus:ring-[#D8B66A]/40 accent-[#B7832F]"
                    />

                    <span>
                      <span className="block text-sm font-medium text-[#5C544A]">
                        Primary relationship
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#8F8578]">
                        Mark this contact as a primary person associated with
                        this property.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50/70 px-5 py-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#EDE7DC] p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg border border-[#EDE7DC] bg-white/50 px-5 py-3 text-sm font-medium text-[#7C7265] transition hover:border-[#D8B66A]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLinkContact}
                disabled={isSaving || !selectedContactId}
                className="rounded-lg bg-[#B7832F] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#D8B66A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Linking Contact..." : "Link Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}