import { createClient } from "@/lib/supabase/server";

export async function getActivity(
  organizationId: string,
  entityType: string,
  entityId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(3);
    

  if (error) {
    console.error("Activity Error:");
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  const userIds = [...new Set(data.map((item) => item.created_by))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  if (profilesError) {
    console.error("Profiles Error:", profilesError);
    throw profilesError;
  }

  const profileMap = new Map(
  (profiles ?? []).map((profile) => [profile.id, profile]),
);

return (data ?? []).map((activity) => ({
  ...activity,
  user: profileMap.get(activity.created_by) ?? null,
}));
}
