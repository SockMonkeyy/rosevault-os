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

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
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
        setGroupMessage("A group with that name already exists.");
      } else {
        setGroupMessage(error.message);
      }

      setIsCreatingGroup(false);
      return;
    }

    setGroups((current) =>
      [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
    );

    setGroupName("");
    setGroupDescription("");
    setGroupMessage("Group created successfully.");
    setIsCreatingGroup(false);

    router.refresh();
  }

  async function handleCreateTag(event: FormEvent<HTMLFormElement>) {
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
        setTagMessage("A tag with that name already exists.");
      } else {
        setTagMessage(error.message);
      }

      setIsCreatingTag(false);
      return;
    }

    setTags((current) =>
      [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
    );

    setTagName("");
    setTagMessage("Tag created successfully.");
    setIsCreatingTag(false);

    router.refresh();
  }

  async function handleDeleteGroup(group: Group) {
    const confirmed = window.confirm(
      `Delete the group "${group.name}"? Contacts will not be deleted, but their membership in this group will be removed.`,
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
      current.filter((item) => item.id !== group.id),
    );

    setGroupMessage("Group deleted successfully.");
    router.refresh();
  }

  async function handleDeleteTag(tag: Tag) {
    const confirmed = window.confirm(
      `Delete the tag "${tag.name}"? Contacts will not be deleted, but this tag will be removed from them.`,
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
      current.filter((item) => item.id !== tag.id),
    );

    setTagMessage("Tag deleted successfully.");
    router.refresh();
  }

  const inputClasses =
    "w-full rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#B7AEA2] hover:border-[#D5CABB] focus:border-[#B7832F]/60 focus:bg-white focus:ring-2 focus:ring-[#B7832F]/10";

  const labelClasses =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]";

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      {/* Groups */}
      <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
        <div className="mb-7">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Relationship Collections
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Contact Groups
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7C7265]">
                Organize contacts into broader lists for filtering, marketing,
                workflows, and relationship management.
              </p>
            </div>

            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[#171512] px-2.5 text-[10px] font-semibold tracking-wider text-[#D8B66A]">
              {groups.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className={labelClasses}>Group Name</label>

            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Example: Birmingham Buyers"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Description</label>

            <textarea
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              rows={3}
              placeholder="Optional description..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingGroup}
            className="w-full cursor-pointer rounded-md bg-[#0D0C0A] px-4 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingGroup ? "Creating Group..." : "+ Create Group"}
          </button>
        </form>

        {groupMessage && <Message text={groupMessage} />}

        <div className="mt-8 border-t border-[#EDE7DC]/80 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-sm font-normal tracking-wide text-[#29231D]">
              Your Groups
            </h3>

            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
              {groups.length} total
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] px-5 py-8 text-center">
              <p className="text-xs text-[#7C7265]">
                No groups created yet.
              </p>

              <p className="mt-1.5 text-[10px] leading-relaxed text-[#A89C8D]">
                Create your first relationship collection above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-[#EDE7DC] bg-white/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8B66A]/30 hover:bg-white/80"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-medium tracking-wide text-[#29231D] transition-colors duration-300 group-hover:text-[#B7832F]">
                      {group.name}
                    </p>

                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#7C7265]">
                      {group.description || "No description provided."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group)}
                    className="shrink-0 cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-[#A89C8D] transition-colors duration-300 hover:text-red-600"
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
      <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
        <div className="mb-7">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
            Flexible Classifications
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-normal tracking-wide text-[#29231D]">
                Contact Tags
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7C7265]">
                Add flexible labels for lead temperature, opportunities,
                property interests, follow-up needs, and other useful details.
              </p>
            </div>

            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[#171512] px-2.5 text-[10px] font-semibold tracking-wider text-[#D8B66A]">
              {tags.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleCreateTag} className="space-y-4">
          <div>
            <label className={labelClasses}>Tag Name</label>

            <input
              type="text"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="Example: Jefferson County"
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingTag}
            className="w-full cursor-pointer rounded-md bg-[#0D0C0A] px-4 py-3 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#211E1A] hover:text-[#EAE5DE] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingTag ? "Creating Tag..." : "+ Create Tag"}
          </button>
        </form>

        {tagMessage && <Message text={tagMessage} />}

        <div className="mt-8 border-t border-[#EDE7DC]/80 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-sm font-normal tracking-wide text-[#29231D]">
              Your Tags
            </h3>

            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A89C8D]">
              {tags.length} total
            </span>
          </div>

          {tags.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E3DCD0] bg-[#12110F]/[0.01] px-5 py-8 text-center">
              <p className="text-xs text-[#7C7265]">
                No tags created yet.
              </p>

              <p className="mt-1.5 text-[10px] leading-relaxed text-[#A89C8D]">
                Create your first flexible classification above.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 rounded-full border border-[#E3DCD0] bg-white/60 px-3.5 py-2 transition-all duration-300 hover:border-[#D8B66A]/50 hover:bg-[#B7832F]/5"
                >
                  <span className="text-[11px] font-medium tracking-wide text-[#5F574D] transition-colors duration-300 group-hover:text-[#B7832F]">
                    {tag.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag)}
                    aria-label={`Delete ${tag.name}`}
                    className="cursor-pointer text-xs leading-none text-[#B7AEA2] transition-colors duration-300 hover:text-red-600"
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
      className={`mt-5 rounded-md border px-4 py-3 text-xs leading-relaxed ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
          : "border-red-200 bg-red-50/70 text-red-700"
      }`}
    >
      {text}
    </div>
  );
}