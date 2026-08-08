import { createClient } from "@/lib/supabase/server";

interface LogActivityParams {
  transactionId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  activityType: string;
  description: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  organizationId,
  entityType,
  entityId,
  activityType,
  description,
  createdBy,
  metadata = {},
}: LogActivityParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    activity_type: activityType,
    title: activityType, // Using activityType as title for now
    description,
    created_by: createdBy,
    metadata,
  });

  if (error) {
    console.error("Activity Log Error:", error);
  }
}