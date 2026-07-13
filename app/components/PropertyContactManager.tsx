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
        className="rounded-lg bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e2c35b]"
      >
        + Link Contact
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#333333] bg-[#151515] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#2a2a2a] p-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Link Existing Contact
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Search your RoseVault contacts and connect an existing
                  person or business to this property.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close"
                className="shrink-0 rounded-lg border border-[#333333] px-3 py-2 text-gray-400 transition hover:border-[#555555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Search */}
              <div>
                <label
                  htmlFor="contact-search"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Search contacts
                </label>

                <input
                  id="contact-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, phone, or contact type..."
                  className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]"
                />
              </div>

              {/* Contact results */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-300">
                    Available contacts
                  </p>

                  <p className="text-xs text-gray-600">
                    {availableContacts.length} available
                  </p>
                </div>

                {availableContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#333333] bg-[#111111] px-5 py-8 text-center">
                    <p className="text-sm text-gray-500">
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

                      const isSelected =
                        selectedContactId === contact.id;

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() =>
                            setSelectedContactId(contact.id)
                          }
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-[#d4af37] bg-[#d4af37]/10"
                              : "border-[#2a2a2a] bg-[#111111] hover:border-[#444444]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p
                                className={`font-medium ${
                                  isSelected
                                    ? "text-[#d4af37]"
                                    : "text-white"
                                }`}
                              >
                                {fullName}
                              </p>

                              {contact.email && (
                                <p className="mt-1 truncate text-sm text-gray-500">
                                  {contact.email}
                                </p>
                              )}

                              {(contact.primary_phone ||
                                contact.secondary_phone) && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {contact.primary_phone ||
                                    contact.secondary_phone}
                                </p>
                              )}
                            </div>

                            {contact.contact_type && (
                              <span className="shrink-0 rounded-full border border-[#333333] bg-[#1a1a1a] px-2.5 py-1 text-xs capitalize text-gray-400">
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
                <div className="space-y-5 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                      Selected Contact
                    </p>

                    <p className="mt-2 font-medium text-white">
                      {[selectedContact.first_name, selectedContact.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Contact"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="relationship-type"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Relationship to property
                    </label>

                    <select
                      id="relationship-type"
                      value={relationshipType}
                      onChange={(event) =>
                        setRelationshipType(event.target.value)
                      }
                      className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
                    >
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#333333] bg-[#111111] p-4">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(event) =>
                        setIsPrimary(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#d4af37]"
                    />

                    <span>
                      <span className="block text-sm font-medium text-white">
                        Primary relationship
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        Mark this contact as a primary person associated with
                        this property.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-5 py-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#2a2a2a] p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#555555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLinkContact}
                disabled={isSaving || !selectedContactId}
                className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-50"
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