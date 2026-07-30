"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleChecklistItem(
  itemId: string,
  completed: boolean,
  transactionId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const update = completed
    ? {
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user?.id ?? null,
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

  revalidatePath(`/transactions/${transactionId}`);
}