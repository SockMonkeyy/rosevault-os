"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  propertyId: string;
  contactId: string;
  organizationId: string;
  contactName: string;
  currentRelationshipType: string | null;
  currentIsPrimary: boolean | null;
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

export default function PropertyRelationshipActions({
  propertyId,
  contactId,
  organizationId,
  contactName,
  currentRelationshipType,
  currentIsPrimary,
}: Props) {
  const router = useRouter();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUnlinkOpen, setIsUnlinkOpen] = useState(false);

  const [relationshipType, setRelationshipType] = useState(
    currentRelationshipType || "owner",
  );

  const [isPrimary, setIsPrimary] = useState(
    currentIsPrimary ?? false,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function openEditModal() {
    setRelationshipType(currentRelationshipType || "owner");
    setIsPrimary(currentIsPrimary ?? false);
    setErrorMessage("");
    setIsEditOpen(true);
  }

  function closeEditModal() {
    if (isSaving) {
      return;
    }

    setIsEditOpen(false);
    setErrorMessage("");
  }

  function openUnlinkModal() {
    setErrorMessage("");
    setIsUnlinkOpen(true);
  }

  function closeUnlinkModal() {
    if (isUnlinking) {
      return;
    }

    setIsUnlinkOpen(false);
    setErrorMessage("");
  }

  async function handleSaveRelationship() {
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
        .update({
          relationship_type: relationshipType,
          is_primary: isPrimary,
        })
        .eq("organization_id", organizationId)
        .eq("property_id", propertyId)
        .eq("contact_id", contactId);

      if (error) {
        setErrorMessage(
          `Unable to update relationship: ${error.message}`,
        );
        setIsSaving(false);
        return;
      }

      setIsEditOpen(false);
      setIsSaving(false);

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to update relationship: ${error.message}`
          : "An unexpected error occurred while updating the relationship.",
      );

      setIsSaving(false);
    }
  }

  async function handleUnlinkContact() {
    setIsUnlinking(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("contact_property_relationships")
        .delete()
        .eq("organization_id", organizationId)
        .eq("property_id", propertyId)
        .eq("contact_id", contactId);

      if (error) {
        setErrorMessage(
          `Unable to unlink contact: ${error.message}`,
        );
        setIsUnlinking(false);
        return;
      }

      setIsUnlinkOpen(false);
      setIsUnlinking(false);

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to unlink contact: ${error.message}`
          : "An unexpected error occurred while unlinking the contact.",
      );

      setIsUnlinking(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openEditModal}
          className="rounded-lg border border-[#333333] px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#d4af37] hover:text-[#d4af37]"
        >
          Edit Relationship
        </button>

        <button
          type="button"
          onClick={openUnlinkModal}
          className="rounded-lg border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-600 hover:bg-red-950/30"
        >
          Unlink
        </button>
      </div>

      {/* Edit relationship modal */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#333333] bg-[#151515] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#2a2a2a] p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Edit Relationship
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Update how {contactName} is connected to this property.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving}
                aria-label="Close"
                className="shrink-0 rounded-lg border border-[#333333] px-3 py-2 text-gray-400 transition hover:border-[#555555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor={`relationship-type-${contactId}`}
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Relationship to property
                </label>

                <select
                  id={`relationship-type-${contactId}`}
                  value={relationshipType}
                  onChange={(event) =>
                    setRelationshipType(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition focus:border-[#d4af37]"
                >
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#333333] bg-[#111111] p-4">
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
                    Mark this contact as a primary person associated with this
                    property.
                  </span>
                </span>
              </label>

              {errorMessage && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-5 py-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#2a2a2a] p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving}
                className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#555555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRelationship}
                disabled={isSaving}
                className="rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink confirmation modal */}
      {isUnlinkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUnlinkModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-red-900/40 bg-[#151515] shadow-2xl">
            <div className="border-b border-[#2a2a2a] p-6">
              <h2 className="text-xl font-semibold text-white">
                Unlink Contact?
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                This will remove the relationship between{" "}
                <span className="font-medium text-white">
                  {contactName}
                </span>{" "}
                and this property.
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                The contact itself will not be deleted from RoseVault.
              </p>
            </div>

            <div className="p-6">
              {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-900/40 bg-red-950/20 px-5 py-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeUnlinkModal}
                  disabled={isUnlinking}
                  className="rounded-lg border border-[#333333] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-[#555555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUnlinkContact}
                  disabled={isUnlinking}
                  className="rounded-lg border border-red-700 bg-red-950/30 px-6 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUnlinking ? "Unlinking..." : "Yes, Unlink Contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}