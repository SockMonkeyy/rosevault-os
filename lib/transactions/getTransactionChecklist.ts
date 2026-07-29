import { createClient } from "@/lib/supabase/server";

export async function getTransactionChecklist(
  organizationId: string,
  transactionId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transaction_checklist_items")
    .select(`
      id,
      item_id,
      title,
      completed,
      completed_at,
      completed_by,
      auto_completed
    `)
    .eq("organization_id", organizationId)
    .eq("transaction_id", transactionId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Error loading checklist:",
      error,
    );

    return [];
  }

  return data;
}