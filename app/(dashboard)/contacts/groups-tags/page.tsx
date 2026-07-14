import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupsTagsManager from "@/app/components/GroupsTagsManager";

export default async function GroupsTagsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const [{ data: groups }, { data: tags }] = await Promise.all([
    supabase
      .from("contact_groups")
      .select("id, name, description")
      .eq("organization_id", membership.organization_id)
      .order("name"),

    supabase
      .from("contact_tags")
      .select("id, name")
      .eq("organization_id", membership.organization_id)
      .order("name"),
  ]);

  const groupCount = groups?.length ?? 0;
  const tagCount = tags?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-12 lg:py-16">
      {/* Editorial Header */}
      <header className="mb-12 border-b border-[#EDE7DC]/60 pb-8">
        <Link
          href="/contacts"
          className="group inline-flex cursor-pointer items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F] transition-colors duration-300 hover:text-[#916520]"
        >
          <span className="mr-1 transform transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          Back to Contact Registry
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
              Contact Intelligence
            </p>

            <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
              Groups & Tags
            </h1>

            <p className="mt-3 max-w-3xl text-xs leading-relaxed tracking-wide text-[#7C7265]">
              Create and manage custom contact classifications for organization,
              filtering, marketing campaigns, workflows, and future RoseVault
              automations.
            </p>
          </div>

          {/* Classification Summary */}
          <div className="flex items-center gap-3">
            <div className="min-w-[110px] rounded-xl border border-[#EDE7DC] bg-white/40 px-5 py-4 text-center backdrop-blur-sm">
              <p className="font-serif text-xl text-[#29231D]">
                {groupCount}
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A89C8D]">
                Groups
              </p>
            </div>

            <div className="min-w-[110px] rounded-xl border border-[#EDE7DC] bg-white/40 px-5 py-4 text-center backdrop-blur-sm">
              <p className="font-serif text-xl text-[#29231D]">
                {tagCount}
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A89C8D]">
                Tags
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Groups & Tags Management Workspace */}
      <GroupsTagsManager
        organizationId={membership.organization_id}
        initialGroups={groups ?? []}
        initialTags={tags ?? []}
      />
    </div>
  );
}