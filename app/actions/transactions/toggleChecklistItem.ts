"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/logActivity";

import { ActivityType } from "@/lib/activity/types";

export async function toggleChecklistItem(
  itemId: string,
  completed: boolean,
  transactionId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const { data: checklistItem } = await supabase
  .from("transaction_checklist_items")
  .select(`
    title,
    transaction_id,
    organization_id
  `)
  .eq("id", itemId)
  .single();

  const update = completed
    ? {
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      }
    : {
        completed: false,
        completed_at: null,
        completed_by: null,
      };

  const { error } = await supabase
    .from("transaction_checklist_items")
    .update(update)
    .eq("id", itemId);

  if (error) {
    console.error(error);
    throw new Error("Unable to update checklist item.");
  }

  if (checklistItem) {
    await logActivity({
      organizationId: checklistItem.organization_id,
      transactionId: checklistItem.transaction_id,
      entityType: "transaction_checklist_item",
      entityId: itemId,
      createdBy: user?.id ?? null,
      activityType: completed
        ? ActivityType.CHECKLIST_COMPLETED
        : ActivityType.CHECKLIST_REOPENED,
      description: checklistItem.title,
    });
  }

  revalidatePath(`/transactions/${transactionId}`);
}