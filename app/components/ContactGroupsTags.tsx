"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Group = {
  id: string;
  name: string;
  description: string | null;
};

type Tag = {
  id: string;
  name: string;
};

type Props = {
  contactId: string;
  organizationId: string;
  groups: Group[];
  tags: Tag[];
  assignedGroupIds: string[];
  assignedTagIds: string[];
};

export default function ContactGroupsTags({
  contactId,
  organizationId,
  groups,
  tags,
  assignedGroupIds,
  assignedTagIds,
}: Props) {
  const router = useRouter();

  const [selectedGroups, setSelectedGroups] =
    useState<string[]>(assignedGroupIds);

  const [selectedTags, setSelectedTags] =
    useState<string[]>(assignedTagIds);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function toggleGroup(groupId: string) {
    setSelectedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  function toggleTag(tagId: string) {
    setSelectedTags((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    const supabase = createClient();

    const { error: deleteGroupsError } = await supabase
      .from("contact_group_memberships")
      .delete()
      .eq("contact_id", contactId)
      .eq("organization_id", organizationId);

    if (deleteGroupsError) {
      setMessage(deleteGroupsError.message);
      setIsSaving(false);
      return;
    }

    if (selectedGroups.length > 0) {
      const groupRows = selectedGroups.map((groupId) => ({
        organization_id: organizationId,
        contact_id: contactId,
        group_id: groupId,
      }));

      const { error: insertGroupsError } = await supabase
        .from("contact_group_memberships")
        .insert(groupRows);

      if (insertGroupsError) {
        setMessage(insertGroupsError.message);
        setIsSaving(false);
        return;
      }
    }

    const { error: deleteTagsError } = await supabase
      .from("contact_tag_assignments")
      .delete()
      .eq("contact_id", contactId)
      .eq("organization_id", organizationId);

    if (deleteTagsError) {
      setMessage(deleteTagsError.message);
      setIsSaving(false);
      return;
    }

    if (selectedTags.length > 0) {
      const tagRows = selectedTags.map((tagId) => ({
        organization_id: organizationId,
        contact_id: contactId,
        tag_id: tagId,
      }));

      const { error: insertTagsError } = await supabase
        .from("contact_tag_assignments")
        .insert(tagRows);

      if (insertTagsError) {
        setMessage(insertTagsError.message);
        setIsSaving(false);
        return;
      }
    }

    setMessage("Groups and tags saved successfully.");
    setIsSaving(false);

    router.refresh();
  }

  return (
    <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
      {/* Header */}
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
          Contact Classification
        </p>

        <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
          Groups & Tags
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-[#7C7265]">
          Organize this contact for filtering, marketing, workflows, and future
          automations.
        </p>
      </div>

      {/* Groups */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
            Groups
          </p>

          {selectedGroups.length > 0 && (
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#B7832F]">
              {selectedGroups.length} selected
            </span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] px-4 py-5 text-center">
            <p className="text-xs text-[#7C7265]">
              No groups have been created yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const selected = selectedGroups.includes(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-[11px] font-medium tracking-wide transition-all duration-300 ${
                    selected
                      ? "border-[#D8B66A]/60 bg-[#B7832F]/10 text-[#916520] shadow-sm"
                      : "border-[#E3DCD0] bg-white/60 text-[#5F574D] hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F]"
                  }`}
                >
                  {selected && (
                    <span className="mr-1 text-[#B7832F]">✓</span>
                  )}

                  {group.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mt-7 border-t border-[#EDE7DC]/70 pt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
            Tags
          </p>

          {selectedTags.length > 0 && (
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#B7832F]">
              {selectedTags.length} selected
            </span>
          )}
        </div>

        {tags.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] px-4 py-5 text-center">
            <p className="text-xs text-[#7C7265]">
              No tags have been created yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedTags.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-[11px] font-medium tracking-wide transition-all duration-300 ${
                    selected
                      ? "border-[#D8B66A]/60 bg-[#B7832F]/10 text-[#916520] shadow-sm"
                      : "border-[#E3DCD0] bg-white/60 text-[#5F574D] hover:border-[#D8B66A]/60 hover:bg-[#B7832F]/5 hover:text-[#B7832F]"
                  }`}
                >
                  {selected && (
                    <span className="mr-1 text-[#B7832F]">✓</span>
                  )}

                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mt-6 rounded-md border px-4 py-3 text-xs leading-relaxed ${
            message.toLowerCase().includes("successfully")
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
              : "border-red-200 bg-red-50/70 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Save Action */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 w-full cursor-pointer rounded-md bg-[#0D0C0A] px-4 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving Changes..." : "Save Groups & Tags"}
      </button>
    </section>
  );
}