import { createClient } from "@/lib/supabase/server";

export async function getTransactionNotes(
  organizationId: string,
  transactionId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transaction_notes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading transaction notes:", error);
    return [];
  }

  return data;
}