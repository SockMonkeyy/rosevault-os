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

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/contacts"
            className="mb-4 inline-block text-sm text-[#d4af37] hover:underline"
          >
            ← Back to Contacts
          </Link>

          <h1 className="text-3xl font-semibold">
            Groups & Tags
          </h1>

          <p className="mt-2 max-w-3xl text-gray-400">
            Create and manage custom contact groups and tags for
            organization, filtering, marketing campaigns, workflows,
            and future RoseVault automations.
          </p>
        </div>

        <GroupsTagsManager
          organizationId={membership.organization_id}
          initialGroups={groups ?? []}
          initialTags={tags ?? []}
        />
      </div>
    </div>
  );
}