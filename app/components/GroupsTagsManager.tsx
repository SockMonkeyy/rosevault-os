"use client";

import { FormEvent, useState } from "react";
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
  organizationId: string;
  initialGroups: Group[];
  initialTags: Tag[];
};

export default function GroupsTagsManager({
  organizationId,
  initialGroups,
  initialTags,
}: Props) {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [tagName, setTagName] = useState("");

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [groupMessage, setGroupMessage] = useState("");
  const [tagMessage, setTagMessage] = useState("");

  async function handleCreateGroup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setGroupMessage("Please enter a group name.");
      return;
    }

    setIsCreatingGroup(true);
    setGroupMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setGroupMessage("Your session has expired. Please sign in again.");
      setIsCreatingGroup(false);
      return;
    }

    const { data, error } = await supabase
      .from("contact_groups")
      .insert({
        organization_id: organizationId,
        name: trimmedName,
        description: groupDescription.trim() || null,
        created_by: user.id,
      })
      .select("id, name, description")
      .single();

    if (error) {
      if (error.code === "23505") {
        setGroupMessage(
          "A group with that name already exists."
        );
      } else {
        setGroupMessage(error.message);
      }

      setIsCreatingGroup(false);
      return;
    }

    setGroups((current) =>
      [...current, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setGroupName("");
    setGroupDescription("");
    setGroupMessage("Group created successfully.");
    setIsCreatingGroup(false);

    router.refresh();
  }

  async function handleCreateTag(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = tagName.trim();

    if (!trimmedName) {
      setTagMessage("Please enter a tag name.");
      return;
    }

    setIsCreatingTag(true);
    setTagMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTagMessage("Your session has expired. Please sign in again.");
      setIsCreatingTag(false);
      return;
    }

    const { data, error } = await supabase
      .from("contact_tags")
      .insert({
        organization_id: organizationId,
        name: trimmedName,
        created_by: user.id,
      })
      .select("id, name")
      .single();

    if (error) {
      if (error.code === "23505") {
        setTagMessage(
          "A tag with that name already exists."
        );
      } else {
        setTagMessage(error.message);
      }

      setIsCreatingTag(false);
      return;
    }

    setTags((current) =>
      [...current, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setTagName("");
    setTagMessage("Tag created successfully.");
    setIsCreatingTag(false);

    router.refresh();
  }

  async function handleDeleteGroup(group: Group) {
    const confirmed = window.confirm(
      `Delete the group "${group.name}"? Contacts will not be deleted, but their membership in this group will be removed.`
    );

    if (!confirmed) {
      return;
    }

    setGroupMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("contact_groups")
      .delete()
      .eq("id", group.id)
      .eq("organization_id", organizationId);

    if (error) {
      setGroupMessage(error.message);
      return;
    }

    setGroups((current) =>
      current.filter((item) => item.id !== group.id)
    );

    setGroupMessage("Group deleted successfully.");
    router.refresh();
  }

  async function handleDeleteTag(tag: Tag) {
    const confirmed = window.confirm(
      `Delete the tag "${tag.name}"? Contacts will not be deleted, but this tag will be removed from them.`
    );

    if (!confirmed) {
      return;
    }

    setTagMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("contact_tags")
      .delete()
      .eq("id", tag.id)
      .eq("organization_id", organizationId);

    if (error) {
      setTagMessage(error.message);
      return;
    }

    setTags((current) =>
      current.filter((item) => item.id !== tag.id)
    );

    setTagMessage("Tag deleted successfully.");
    router.refresh();
  }

  const inputClasses =
    "w-full rounded-lg border border-[#333333] bg-[#0f0f0f] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

      {/* Groups */}
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Contact Groups
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Organize contacts into broader lists for filtering,
            marketing, workflows, and relationship management.
          </p>
        </div>

        <form
          onSubmit={handleCreateGroup}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Group name
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(event) =>
                setGroupName(event.target.value)
              }
              placeholder="Example: Birmingham Buyers"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Description
            </label>

            <textarea
              value={groupDescription}
              onChange={(event) =>
                setGroupDescription(event.target.value)
              }
              rows={3}
              placeholder="Optional description..."
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingGroup}
            className="w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingGroup
              ? "Creating group..."
              : "+ Create Group"}
          </button>
        </form>

        {groupMessage && (
          <Message text={groupMessage} />
        )}

        <div className="mt-8 border-t border-[#2a2a2a] pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              Your Groups
            </h3>

            <span className="text-sm text-gray-500">
              {groups.length} total
            </span>
          </div>

          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#333333] p-5 text-center text-sm text-gray-500">
              No groups created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {group.name}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      {group.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteGroup(group)
                    }
                    className="shrink-0 text-sm text-gray-600 transition hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Contact Tags
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Add flexible labels for lead temperature,
            opportunities, property interests, follow-up needs,
            and other useful details.
          </p>
        </div>

        <form
          onSubmit={handleCreateTag}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tag name
            </label>

            <input
              type="text"
              value={tagName}
              onChange={(event) =>
                setTagName(event.target.value)
              }
              placeholder="Example: Jefferson County"
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingTag}
            className="w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e2c35b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingTag
              ? "Creating tag..."
              : "+ Create Tag"}
          </button>
        </form>

        {tagMessage && (
          <Message text={tagMessage} />
        )}

        <div className="mt-8 border-t border-[#2a2a2a] pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              Your Tags
            </h3>

            <span className="text-sm text-gray-500">
              {tags.length} total
            </span>
          </div>

          {tags.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#333333] p-5 text-center text-sm text-gray-500">
              No tags created yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 rounded-full border border-[#333333] bg-[#111111] px-4 py-2"
                >
                  <span className="text-sm text-gray-300">
                    {tag.name}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteTag(tag)
                    }
                    aria-label={`Delete ${tag.name}`}
                    className="text-xs text-gray-600 transition hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Message({ text }: { text: string }) {
  const isSuccess = text.toLowerCase().includes("successfully");

  return (
    <div
      className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
        isSuccess
          ? "border-green-900/50 bg-green-950/30 text-green-300"
          : "border-red-900/50 bg-red-950/30 text-red-300"
      }`}
    >
      {text}
    </div>
  );
}