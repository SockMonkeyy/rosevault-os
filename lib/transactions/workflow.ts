import { createClient } from "@/lib/supabase/server";
import { TransactionStage } from "./stages";
import { TRANSACTION_CHECKLISTS } from "./checklistTemplates";

export async function ensureChecklistForStage(
  organizationId: string,
  transactionId: string,
  stage: TransactionStage,
) {
  const supabase = await createClient();

  const template =
    TRANSACTION_CHECKLISTS[stage] ?? [];

  const { data: existing, error } = await supabase
    .from("transaction_checklist_items")
    .select("item_id")
    .eq("transaction_id", transactionId);

  if (error) {
    throw error;
  }

  const existingIds = new Set(
    existing.map((item) => item.item_id),
  );

  const rows = template
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({
      organization_id: organizationId,
      transaction_id: transactionId,
      item_id: item.id,
      title: item.title,
      completed: false,
      auto_completed: false,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("transaction_checklist_items")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }
}

export async function getChecklistProgress(
  transactionId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transaction_checklist_items")
    .select("completed")
    .eq("transaction_id", transactionId);

  if (error) {
    throw error;
  }

  const total = data.length;

  const completed = data.filter(
    (item) => item.completed,
  ).length;

  return {
    total,
    completed,
    percent:
      total === 0
        ? 0
        : Math.round((completed / total) * 100),
  };
}