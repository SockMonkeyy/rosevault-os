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
        : [...current, groupId]
    );
  }

  function toggleTag(tagId: string) {
    setSelectedTags((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
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
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Groups & Tags
        </h2>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          Organize this contact for filtering, marketing, workflows,
          and future automations.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Groups
        </p>

        {groups.length === 0 ? (
          <p className="text-sm text-gray-500">
            No groups have been created yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const selected = selectedGroups.includes(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]"
                      : "border-[#333333] text-gray-400 hover:border-[#d4af37]/60 hover:text-[#d4af37]"
                  }`}
                >
                  {selected ? "✓ " : ""}
                  {group.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Tags
        </p>

        {tags.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tags have been created yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedTags.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]"
                      : "border-[#333333] text-gray-400 hover:border-[#d4af37]/60 hover:text-[#d4af37]"
                  }`}
                >
                  {selected ? "✓ " : ""}
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            message.includes("successfully")
              ? "border-green-900/50 bg-green-950/30 text-green-300"
              : "border-red-900/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Groups & Tags"}
      </button>
    </section>
  );
}