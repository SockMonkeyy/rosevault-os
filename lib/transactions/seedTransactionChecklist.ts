import { createClient } from "@/lib/supabase/server";

import {
  TRANSACTION_CHECKLISTS,
} from "@/lib/transactions/checklistTemplates";

import {
  TransactionStage,
} from "@/lib/transactions/stages";

export async function seedTransactionChecklist(
  organizationId: string,
  transactionId: string,
  stage: TransactionStage,
) {
  const supabase = await createClient();

  const template =
    TRANSACTION_CHECKLISTS[stage] ?? [];

  const { data: existing } = await supabase
    .from("transaction_checklist_items")
    .select("item_id")
    .eq("transaction_id", transactionId);

  const existingIds =
    new Set(existing?.map((i) => i.item_id));

  const rows = template
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({
      organization_id: organizationId,
      transaction_id: transactionId,
      item_id: item.id,
      title: item.title,
      auto_completed: false,
    }));

  if (rows.length > 0) {
    await supabase
      .from("transaction_checklist_items")
      .insert(rows);
  }
}